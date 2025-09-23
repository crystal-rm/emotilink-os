// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title EmotionValidation
 * @dev Advanced validation contract for emotional data integrity
 * @author EmotiLink OS Team
 */
contract EmotionValidation is Ownable, ReentrancyGuard, Pausable {
    
    // Structs
    struct ValidationRule {
        uint8 emotionType;
        uint8 minIntensity;
        uint8 maxIntensity;
        uint8 minConfidence;
        bool isActive;
        uint256 createdAt;
    }
    
    struct ValidationResult {
        bool isValid;
        string reason;
        uint256 timestamp;
        address validator;
    }
    
    struct DataIntegrity {
        uint256 dataId;
        bool isConsistent;
        uint256 validationCount;
        uint256 positiveValidations;
        uint256 negativeValidations;
        uint256 lastValidationTime;
    }
    
    // Events
    event ValidationRuleCreated(
        uint8 indexed emotionType,
        uint8 minIntensity,
        uint8 maxIntensity,
        uint8 minConfidence,
        uint256 timestamp
    );
    
    event ValidationRuleUpdated(
        uint8 indexed emotionType,
        bool isActive,
        uint256 timestamp
    );
    
    event DataValidated(
        uint256 indexed dataId,
        bool isValid,
        string reason,
        address indexed validator,
        uint256 timestamp
    );
    
    event DataIntegrityUpdated(
        uint256 indexed dataId,
        bool isConsistent,
        uint256 validationCount,
        uint256 timestamp
    );
    
    // State variables
    mapping(uint8 => ValidationRule) public validationRules;
    mapping(uint256 => ValidationResult[]) public validationResults;
    mapping(uint256 => DataIntegrity) public dataIntegrity;
    
    address public emotionOracle;
    uint256 public minimumValidations = 3;
    uint256 public validationTimeWindow = 1 hours;
    uint256 public maxValidationAttempts = 10;
    
    // Modifiers
    modifier onlyOracle() {
        require(msg.sender == emotionOracle, "Only oracle can call this function");
        _;
    }
    
    modifier validEmotionType(uint8 _emotionType) {
        require(_emotionType >= 0 && _emotionType <= 5, "Invalid emotion type");
        _;
    }
    
    constructor(address _emotionOracle) Ownable(msg.sender) {
        emotionOracle = _emotionOracle;
        _initializeDefaultRules();
    }
    
    /**
     * @dev Initialize default validation rules
     */
    function _initializeDefaultRules() internal {
        // Joy validation rule
        validationRules[0] = ValidationRule({
            emotionType: 0,
            minIntensity: 6,
            maxIntensity: 10,
            minConfidence: 70,
            isActive: true,
            createdAt: block.timestamp
        });
        
        // Sadness validation rule
        validationRules[1] = ValidationRule({
            emotionType: 1,
            minIntensity: 4,
            maxIntensity: 10,
            minConfidence: 60,
            isActive: true,
            createdAt: block.timestamp
        });
        
        // Anger validation rule
        validationRules[2] = ValidationRule({
            emotionType: 2,
            minIntensity: 5,
            maxIntensity: 10,
            minConfidence: 65,
            isActive: true,
            createdAt: block.timestamp
        });
        
        // Fear validation rule
        validationRules[3] = ValidationRule({
            emotionType: 3,
            minIntensity: 3,
            maxIntensity: 10,
            minConfidence: 55,
            isActive: true,
            createdAt: block.timestamp
        });
        
        // Surprise validation rule
        validationRules[4] = ValidationRule({
            emotionType: 4,
            minIntensity: 4,
            maxIntensity: 10,
            minConfidence: 60,
            isActive: true,
            createdAt: block.timestamp
        });
        
        // Disgust validation rule
        validationRules[5] = ValidationRule({
            emotionType: 5,
            minIntensity: 4,
            maxIntensity: 10,
            minConfidence: 60,
            isActive: true,
            createdAt: block.timestamp
        });
    }
    
    /**
     * @dev Validate emotional data against rules
     * @param _dataId ID of the data to validate
     * @param _emotionType Type of emotion
     * @param _intensity Intensity level
     * @param _confidence Confidence level
     * @param _validator Address of the validator
     */
    function validateData(
        uint256 _dataId,
        uint8 _emotionType,
        uint8 _intensity,
        uint8 _confidence,
        address _validator
    ) external onlyOracle whenNotPaused {
        require(_emotionType >= 0 && _emotionType <= 5, "Invalid emotion type");
        
        ValidationRule memory rule = validationRules[_emotionType];
        require(rule.isActive, "Validation rule not active");
        
        bool isValid = true;
        string memory reason = "";
        
        // Check intensity range
        if (_intensity < rule.minIntensity || _intensity > rule.maxIntensity) {
            isValid = false;
            reason = "Intensity out of valid range";
        }
        
        // Check confidence threshold
        if (_confidence < rule.minConfidence) {
            isValid = false;
            reason = "Confidence below threshold";
        }
        
        // Check for suspicious patterns (basic fraud detection)
        if (_intensity == 10 && _confidence == 100) {
            isValid = false;
            reason = "Suspicious perfect score pattern";
        }
        
        // Record validation result
        validationResults[_dataId].push(ValidationResult({
            isValid: isValid,
            reason: reason,
            timestamp: block.timestamp,
            validator: _validator
        }));
        
        // Update data integrity
        _updateDataIntegrity(_dataId);
        
        emit DataValidated(_dataId, isValid, reason, _validator, block.timestamp);
    }
    
    /**
     * @dev Update data integrity metrics
     * @param _dataId ID of the data
     */
    function _updateDataIntegrity(uint256 _dataId) internal {
        ValidationResult[] memory results = validationResults[_dataId];
        uint256 positiveCount = 0;
        uint256 negativeCount = 0;
        
        for (uint256 i = 0; i < results.length; i++) {
            if (results[i].isValid) {
                positiveCount++;
            } else {
                negativeCount++;
            }
        }
        
        bool isConsistent = positiveCount >= negativeCount;
        
        dataIntegrity[_dataId] = DataIntegrity({
            dataId: _dataId,
            isConsistent: isConsistent,
            validationCount: results.length,
            positiveValidations: positiveCount,
            negativeValidations: negativeCount,
            lastValidationTime: block.timestamp
        });
        
        emit DataIntegrityUpdated(_dataId, isConsistent, results.length, block.timestamp);
    }
    
    /**
     * @dev Create or update validation rule
     * @param _emotionType Type of emotion
     * @param _minIntensity Minimum intensity
     * @param _maxIntensity Maximum intensity
     * @param _minConfidence Minimum confidence
     * @param _isActive Whether rule is active
     */
    function setValidationRule(
        uint8 _emotionType,
        uint8 _minIntensity,
        uint8 _maxIntensity,
        uint8 _minConfidence,
        bool _isActive
    ) external onlyOwner validEmotionType(_emotionType) {
        require(_minIntensity <= _maxIntensity, "Invalid intensity range");
        require(_minConfidence <= 100, "Invalid confidence value");
        
        validationRules[_emotionType] = ValidationRule({
            emotionType: _emotionType,
            minIntensity: _minIntensity,
            maxIntensity: _maxIntensity,
            minConfidence: _minConfidence,
            isActive: _isActive,
            createdAt: block.timestamp
        });
        
        emit ValidationRuleCreated(
            _emotionType,
            _minIntensity,
            _maxIntensity,
            _minConfidence,
            block.timestamp
        );
    }
    
    /**
     * @dev Toggle validation rule status
     * @param _emotionType Type of emotion
     * @param _isActive Whether rule is active
     */
    function toggleValidationRule(
        uint8 _emotionType,
        bool _isActive
    ) external onlyOwner validEmotionType(_emotionType) {
        validationRules[_emotionType].isActive = _isActive;
        
        emit ValidationRuleUpdated(_emotionType, _isActive, block.timestamp);
    }
    
    /**
     * @dev Get validation results for data
     * @param _dataId ID of the data
     * @return Array of validation results
     */
    function getValidationResults(uint256 _dataId) external view returns (ValidationResult[] memory) {
        return validationResults[_dataId];
    }
    
    /**
     * @dev Get data integrity information
     * @param _dataId ID of the data
     * @return DataIntegrity struct
     */
    function getDataIntegrity(uint256 _dataId) external view returns (DataIntegrity memory) {
        return dataIntegrity[_dataId];
    }
    
    /**
     * @dev Check if data meets validation requirements
     * @param _dataId ID of the data
     * @return Whether data is validated
     */
    function isDataValidated(uint256 _dataId) external view returns (bool) {
        DataIntegrity memory integrity = dataIntegrity[_dataId];
        return integrity.isConsistent && 
               integrity.validationCount >= minimumValidations &&
               integrity.positiveValidations > integrity.negativeValidations;
    }
    
    /**
     * @dev Get validation rule for emotion type
     * @param _emotionType Type of emotion
     * @return ValidationRule struct
     */
    function getValidationRule(uint8 _emotionType) external view returns (ValidationRule memory) {
        return validationRules[_emotionType];
    }
    
    /**
     * @dev Set minimum validations required
     * @param _minimumValidations New minimum validations
     */
    function setMinimumValidations(uint256 _minimumValidations) external onlyOwner {
        minimumValidations = _minimumValidations;
    }
    
    /**
     * @dev Set validation time window
     * @param _timeWindow New time window in seconds
     */
    function setValidationTimeWindow(uint256 _timeWindow) external onlyOwner {
        validationTimeWindow = _timeWindow;
    }
    
    /**
     * @dev Set maximum validation attempts
     * @param _maxAttempts New maximum attempts
     */
    function setMaxValidationAttempts(uint256 _maxAttempts) external onlyOwner {
        maxValidationAttempts = _maxAttempts;
    }
    
    /**
     * @dev Pause the contract
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}
