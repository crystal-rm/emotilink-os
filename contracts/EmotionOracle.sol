// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title EmotionOracle
 * @dev Basic oracle contract for emotional data processing - Phase 1
 * @author EmotiLink OS Team
 */
contract EmotionOracle is Ownable, ReentrancyGuard, Pausable {
    
    // Structs
    struct EmotionData {
        uint256 timestamp;
        uint8 emotionType; // 0: joy, 1: sadness, 2: anger, 3: fear, 4: surprise, 5: disgust
        uint8 intensity; // 1-10 scale
        uint8 confidence; // 1-100 percentage
        string context; // Additional context about the emotion
        address submitter;
        bool isValidated;
    }
    
    struct Validator {
        address validatorAddress;
        bool isActive;
        uint256 stakeAmount;
        uint256 reputationScore;
        uint256 totalValidations;
        uint256 successfulValidations;
    }
    
    // Events
    event EmotionDataSubmitted(
        uint256 indexed dataId,
        address indexed submitter,
        uint8 emotionType,
        uint8 intensity,
        uint256 timestamp
    );
    
    event EmotionDataValidated(
        uint256 indexed dataId,
        address indexed validator,
        bool isValid,
        uint256 timestamp
    );
    
    event ValidatorRegistered(
        address indexed validator,
        uint256 stakeAmount,
        uint256 timestamp
    );
    
    // State variables
    mapping(uint256 => EmotionData) public emotionData;
    mapping(address => Validator) public validators;
    mapping(address => uint256[]) public userEmotionData;
    
    uint256 public nextDataId = 1;
    uint256 public minimumStake = 0.1 ether;
    uint256 public validationThreshold = 3; // Minimum validations required
    uint256 public validationReward = 0.01 ether;
    
    address[] public activeValidators;
    
    // Modifiers
    modifier onlyValidator() {
        require(validators[msg.sender].isActive, "Not an active validator");
        _;
    }
    
    modifier validEmotionType(uint8 _emotionType) {
        require(_emotionType >= 0 && _emotionType <= 5, "Invalid emotion type");
        _;
    }
    
    modifier validIntensity(uint8 _intensity) {
        require(_intensity >= 1 && _intensity <= 10, "Invalid intensity value");
        _;
    }
    
    modifier validConfidence(uint8 _confidence) {
        require(_confidence >= 1 && _confidence <= 100, "Invalid confidence value");
        _;
    }
    
    constructor() Ownable(msg.sender) {
        // Initialize with deployer as owner
    }
    
    /**
     * @dev Submit emotional data for processing
     * @param _emotionType Type of emotion (0-5)
     * @param _intensity Intensity level (1-10)
     * @param _confidence Confidence level (1-100)
     * @param _context Additional context about the emotion
     */
    function submitEmotionData(
        uint8 _emotionType,
        uint8 _intensity,
        uint8 _confidence,
        string memory _context
    ) 
        external 
        whenNotPaused
        validEmotionType(_emotionType)
        validIntensity(_intensity)
        validConfidence(_confidence)
    {
        uint256 dataId = nextDataId++;
        
        emotionData[dataId] = EmotionData({
            timestamp: block.timestamp,
            emotionType: _emotionType,
            intensity: _intensity,
            confidence: _confidence,
            context: _context,
            submitter: msg.sender,
            isValidated: false
        });
        
        userEmotionData[msg.sender].push(dataId);
        
        emit EmotionDataSubmitted(dataId, msg.sender, _emotionType, _intensity, block.timestamp);
    }
    
    /**
     * @dev Register as a validator by staking a minimum amount
     */
    function registerValidator() external payable whenNotPaused nonReentrant {
        require(!validators[msg.sender].isActive, "Already registered as validator");
        require(msg.value >= minimumStake, "Insufficient stake amount");
        
        validators[msg.sender] = Validator({
            validatorAddress: msg.sender,
            isActive: true,
            stakeAmount: msg.value,
            reputationScore: 100, // Initial reputation score
            totalValidations: 0,
            successfulValidations: 0
        });
        
        activeValidators.push(msg.sender);
        
        emit ValidatorRegistered(msg.sender, msg.value, block.timestamp);
    }
    
    /**
     * @dev Validate emotional data submitted by a user
     * @param _dataId ID of the emotion data to validate
     * @param _isValid True if data is valid, false otherwise
     */
    function validateEmotionData(uint256 _dataId, bool _isValid) external onlyValidator whenNotPaused nonReentrant {
        require(_dataId < nextDataId, "Invalid data ID");
        require(!emotionData[_dataId].isValidated, "Data already validated");
        
        if (_isValid) {
            emotionData[_dataId].isValidated = true;
            
            // Reward validator
            payable(msg.sender).transfer(validationReward);
            
            // Update validator stats
            validators[msg.sender].reputationScore += 1;
            validators[msg.sender].totalValidations += 1;
            validators[msg.sender].successfulValidations += 1;
        } else {
            // Penalize validator for incorrect validation
            validators[msg.sender].reputationScore = validators[msg.sender].reputationScore > 1 
                ? validators[msg.sender].reputationScore - 1 
                : 1;
            validators[msg.sender].totalValidations += 1;
        }
        
        emit EmotionDataValidated(_dataId, msg.sender, _isValid, block.timestamp);
    }
    
    /**
     * @dev Update minimum stake required for validators
     * @param _newMinimumStake New minimum stake amount
     */
    function setMinimumStake(uint256 _newMinimumStake) external onlyOwner {
        require(_newMinimumStake > 0, "Minimum stake must be greater than 0");
        minimumStake = _newMinimumStake;
    }
    
    /**
     * @dev Update validation threshold for consensus
     * @param _newThreshold New validation threshold
     */
    function setValidationThreshold(uint256 _newThreshold) external onlyOwner {
        require(_newThreshold > 0, "Validation threshold must be greater than 0");
        validationThreshold = _newThreshold;
    }
    
    /**
     * @dev Update reward for successful validation
     * @param _newReward New validation reward
     */
    function setValidationReward(uint256 _newReward) external onlyOwner {
        require(_newReward > 0, "Validation reward must be greater than 0");
        validationReward = _newReward;
    }
    
    /**
     * @dev Pause contract operations
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause contract operations
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Withdraw contract balance (only owner)
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        payable(owner()).transfer(balance);
    }
    
    /**
     * @dev Get contract statistics
     * @return totalData Total number of emotion data entries
     * @return totalValidators Total number of active validators
     * @return contractBalance Current contract balance
     */
    function getContractStats() external view returns (
        uint256 totalData,
        uint256 totalValidators,
        uint256 contractBalance
    ) {
        return (
            nextDataId - 1,
            activeValidators.length,
            address(this).balance
        );
    }
    
    /**
     * @dev Get emotion data by ID
     * @param _dataId ID of the data
     * @return EmotionData struct
     */
    function getEmotionData(uint256 _dataId) external view returns (EmotionData memory) {
        require(_dataId < nextDataId, "Invalid data ID");
        return emotionData[_dataId];
    }
    
    /**
     * @dev Get validator information
     * @param _validator Address of the validator
     * @return Validator struct
     */
    function getValidator(address _validator) external view returns (Validator memory) {
        return validators[_validator];
    }
}