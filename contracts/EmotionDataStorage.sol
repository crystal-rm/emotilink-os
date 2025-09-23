// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title EmotionDataStorage
 * @dev Storage contract for validated emotional data with analytics
 * @author EmotiLink OS Team
 */
contract EmotionDataStorage is Ownable, ReentrancyGuard, Pausable {
    
    // Structs
    struct StoredEmotionData {
        uint256 dataId;
        uint256 timestamp;
        uint8 emotionType;
        uint8 intensity;
        uint8 confidence;
        string context;
        address submitter;
        bool isProcessed;
        uint256 validationScore;
    }
    
    struct EmotionAnalytics {
        uint8 emotionType;
        uint256 totalCount;
        uint256 averageIntensity;
        uint256 averageConfidence;
        uint256 lastUpdated;
    }
    
    struct UserProfile {
        address user;
        uint256 totalSubmissions;
        uint256 validatedSubmissions;
        uint256 averageEmotionIntensity;
        uint256 lastActivity;
        mapping(uint8 => uint256) emotionTypeCount;
    }
    
    // Events
    event DataStored(
        uint256 indexed dataId,
        address indexed submitter,
        uint8 emotionType,
        uint256 timestamp
    );
    
    event DataProcessed(
        uint256 indexed dataId,
        uint256 validationScore,
        uint256 timestamp
    );
    
    event AnalyticsUpdated(
        uint8 indexed emotionType,
        uint256 totalCount,
        uint256 averageIntensity,
        uint256 timestamp
    );
    
    event UserProfileUpdated(
        address indexed user,
        uint256 totalSubmissions,
        uint256 validatedSubmissions,
        uint256 timestamp
    );
    
    // State variables
    mapping(uint256 => StoredEmotionData) public storedData;
    mapping(uint8 => EmotionAnalytics) public emotionAnalytics;
    mapping(address => UserProfile) public userProfiles;
    mapping(address => uint256[]) public userDataIds;
    
    address public emotionOracle;
    address public validationContract;
    
    uint256 public nextStorageId = 1;
    uint256 public totalStoredData = 0;
    uint256 public processingFee = 0.001 ether;
    
    // Modifiers
    modifier onlyOracle() {
        require(msg.sender == emotionOracle, "Only oracle can call this function");
        _;
    }
    
    modifier onlyValidationContract() {
        require(msg.sender == validationContract, "Only validation contract can call this function");
        _;
    }
    
    constructor(address _emotionOracle, address _validationContract) Ownable(msg.sender) {
        emotionOracle = _emotionOracle;
        validationContract = _validationContract;
        _initializeAnalytics();
    }
    
    /**
     * @dev Initialize analytics for all emotion types
     */
    function _initializeAnalytics() internal {
        for (uint8 i = 0; i < 6; i++) {
            emotionAnalytics[i] = EmotionAnalytics({
                emotionType: i,
                totalCount: 0,
                averageIntensity: 0,
                averageConfidence: 0,
                lastUpdated: block.timestamp
            });
        }
    }
    
    /**
     * @dev Store validated emotional data
     * @param _dataId Original data ID from oracle
     * @param _emotionType Type of emotion
     * @param _intensity Intensity level
     * @param _confidence Confidence level
     * @param _context Additional context
     * @param _submitter Address of the submitter
     */
    function storeValidatedData(
        uint256 _dataId,
        uint8 _emotionType,
        uint8 _intensity,
        uint8 _confidence,
        string memory _context,
        address _submitter
    ) external onlyOracle whenNotPaused {
        uint256 storageId = nextStorageId++;
        
        storedData[storageId] = StoredEmotionData({
            dataId: _dataId,
            timestamp: block.timestamp,
            emotionType: _emotionType,
            intensity: _intensity,
            confidence: _confidence,
            context: _context,
            submitter: _submitter,
            isProcessed: false,
            validationScore: 0
        });
        
        userDataIds[_submitter].push(storageId);
        totalStoredData++;
        
        // Update user profile
        _updateUserProfile(_submitter, _emotionType, _intensity);
        
        emit DataStored(storageId, _submitter, _emotionType, block.timestamp);
    }
    
    /**
     * @dev Process stored data and update analytics
     * @param _storageId Storage ID of the data
     * @param _validationScore Validation score from validation contract
     */
    function processData(
        uint256 _storageId,
        uint256 _validationScore
    ) external onlyValidationContract whenNotPaused {
        require(_storageId > 0 && _storageId < nextStorageId, "Invalid storage ID");
        require(!storedData[_storageId].isProcessed, "Data already processed");
        
        StoredEmotionData storage data = storedData[_storageId];
        data.isProcessed = true;
        data.validationScore = _validationScore;
        
        // Update analytics
        _updateEmotionAnalytics(data.emotionType, data.intensity, data.confidence);
        
        emit DataProcessed(_storageId, _validationScore, block.timestamp);
    }
    
    /**
     * @dev Update user profile with new data
     * @param _user User address
     * @param _emotionType Type of emotion
     * @param _intensity Intensity level
     */
    function _updateUserProfile(
        address _user,
        uint8 _emotionType,
        uint8 _intensity
    ) internal {
        UserProfile storage profile = userProfiles[_user];
        
        profile.user = _user;
        profile.totalSubmissions++;
        profile.validatedSubmissions++;
        profile.emotionTypeCount[_emotionType]++;
        profile.lastActivity = block.timestamp;
        
        // Update average intensity (simplified calculation)
        profile.averageEmotionIntensity = 
            (profile.averageEmotionIntensity * (profile.validatedSubmissions - 1) + _intensity) / 
            profile.validatedSubmissions;
        
        emit UserProfileUpdated(_user, profile.totalSubmissions, profile.validatedSubmissions, block.timestamp);
    }
    
    /**
     * @dev Update emotion analytics
     * @param _emotionType Type of emotion
     * @param _intensity Intensity level
     * @param _confidence Confidence level
     */
    function _updateEmotionAnalytics(
        uint8 _emotionType,
        uint8 _intensity,
        uint8 _confidence
    ) internal {
        EmotionAnalytics storage analytics = emotionAnalytics[_emotionType];
        
        analytics.totalCount++;
        
        // Update average intensity
        analytics.averageIntensity = 
            (analytics.averageIntensity * (analytics.totalCount - 1) + _intensity) / 
            analytics.totalCount;
        
        // Update average confidence
        analytics.averageConfidence = 
            (analytics.averageConfidence * (analytics.totalCount - 1) + _confidence) / 
            analytics.totalCount;
        
        analytics.lastUpdated = block.timestamp;
        
        emit AnalyticsUpdated(_emotionType, analytics.totalCount, analytics.averageIntensity, block.timestamp);
    }
    
    /**
     * @dev Get stored data by storage ID
     * @param _storageId Storage ID
     * @return StoredEmotionData struct
     */
    function getStoredData(uint256 _storageId) external view returns (StoredEmotionData memory) {
        require(_storageId > 0 && _storageId < nextStorageId, "Invalid storage ID");
        return storedData[_storageId];
    }
    
    /**
     * @dev Get user's stored data IDs
     * @param _user User address
     * @return Array of storage IDs
     */
    function getUserDataIds(address _user) external view returns (uint256[] memory) {
        return userDataIds[_user];
    }
    
    /**
     * @dev Get user profile
     * @param _user User address
     * @return user User address
     * @return totalSubmissions Total number of submissions
     * @return validatedSubmissions Number of validated submissions
     * @return averageEmotionIntensity Average emotion intensity
     * @return lastActivity Last activity timestamp
     */
    function getUserProfile(address _user) external view returns (
        address user,
        uint256 totalSubmissions,
        uint256 validatedSubmissions,
        uint256 averageEmotionIntensity,
        uint256 lastActivity
    ) {
        UserProfile storage profile = userProfiles[_user];
        return (
            profile.user,
            profile.totalSubmissions,
            profile.validatedSubmissions,
            profile.averageEmotionIntensity,
            profile.lastActivity
        );
    }
    
    /**
     * @dev Get emotion type count for user
     * @param _user User address
     * @param _emotionType Type of emotion
     * @return Count of emotion type
     */
    function getUserEmotionTypeCount(address _user, uint8 _emotionType) external view returns (uint256) {
        return userProfiles[_user].emotionTypeCount[_emotionType];
    }
    
    /**
     * @dev Get emotion analytics
     * @param _emotionType Type of emotion
     * @return EmotionAnalytics struct
     */
    function getEmotionAnalytics(uint8 _emotionType) external view returns (EmotionAnalytics memory) {
        return emotionAnalytics[_emotionType];
    }
    
    /**
     * @dev Get all emotion analytics
     * @return Array of EmotionAnalytics structs
     */
    function getAllEmotionAnalytics() external view returns (EmotionAnalytics[6] memory) {
        EmotionAnalytics[6] memory analytics;
        for (uint8 i = 0; i < 6; i++) {
            analytics[i] = emotionAnalytics[i];
        }
        return analytics;
    }
    
    /**
     * @dev Get contract statistics
     * @return totalStored Total stored data
     * @return totalUsers Total unique users
     * @return contractBalance Current contract balance
     */
    function getContractStats() external view returns (
        uint256 totalStored,
        uint256 totalUsers,
        uint256 contractBalance
    ) {
        return (
            totalStoredData,
            nextStorageId - 1, // Simplified user count
            address(this).balance
        );
    }
    
    /**
     * @dev Set processing fee (only owner)
     * @param _newFee New processing fee
     */
    function setProcessingFee(uint256 _newFee) external onlyOwner {
        processingFee = _newFee;
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
    
    /**
     * @dev Withdraw contract balance (only owner)
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        payable(owner()).transfer(balance);
    }
}
