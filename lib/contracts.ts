import { ethers, Contract, JsonRpcProvider, Wallet } from 'ethers';

// Contract ABIs (will be populated after deployment)
export const EMOTI_TOKEN_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function mint(address to, uint256 amount)",
  "function burn(uint256 amount)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)"
];

export const EMOTION_ORACLE_ABI = [
  "function submitEmotionData(uint8 emotionType, uint8 intensity, uint8 confidence, string memory context) external",
  "function registerValidator() external payable",
  "function validateEmotionData(uint256 dataId, bool isValid) external",
  "function getEmotionData(uint256 dataId) view returns (tuple(uint256 timestamp, uint8 emotionType, uint8 intensity, uint8 confidence, string context, address validator, bool isValidated))",
  "function getValidatorInfo(address validator) view returns (tuple(address validatorAddress, bool isActive, uint256 stakeAmount, uint256 reputationScore, uint256 totalValidations, uint256 successfulValidations))",
  "event EmotionDataSubmitted(uint256 indexed dataId, address indexed submitter, uint8 emotionType, uint8 intensity, uint8 confidence, string context)",
  "event ValidatorRegistered(address indexed validator, uint256 stakeAmount)",
  "event EmotionDataValidated(uint256 indexed dataId, address indexed validator, bool isValid)"
];

export const EMOTION_VALIDATION_ABI = [
  "function validateData(uint256 dataId, uint8 emotionType, uint8 intensity, uint8 confidence, address validator) external",
  "function setValidationRule(uint8 emotionType, uint8 minIntensity, uint8 maxIntensity, uint8 minConfidence, bool isActive) external",
  "function getValidationResult(uint256 dataId) view returns (bool isValid, uint256 validationScore, address[] memory validators)",
  "event DataValidated(uint256 indexed dataId, bool isValid, uint256 validationScore)"
];

export const EMOTION_DATA_STORAGE_ABI = [
  "function storeValidatedData(uint256 dataId, uint8 emotionType, uint8 intensity, uint8 confidence, string memory context, address submitter) external",
  "function processData(uint256 storageId, uint256 validationScore) external",
  "function getStoredData(uint256 storageId) view returns (tuple(uint256 timestamp, uint8 emotionType, uint8 intensity, uint8 confidence, string context, address submitter, bool isProcessed))",
  "event DataStored(uint256 indexed storageId, address indexed submitter, uint8 emotionType)",
  "event DataProcessed(uint256 indexed storageId, uint256 validationScore)"
];

// Contract addresses (will be populated after deployment)
export const CONTRACT_ADDRESSES = {
  EMOTI_TOKEN: process.env.NEXT_PUBLIC_EMOTI_TOKEN_ADDRESS || '',
  EMOTION_ORACLE: process.env.NEXT_PUBLIC_EMOTION_ORACLE_ADDRESS || '',
  EMOTION_VALIDATION: process.env.NEXT_PUBLIC_EMOTION_VALIDATION_ADDRESS || '',
  EMOTION_DATA_STORAGE: process.env.NEXT_PUBLIC_EMOTION_DATA_STORAGE_ADDRESS || '',
};

// Contract service class
export class ContractService {
  private provider: JsonRpcProvider;
  private signer?: Wallet;

  constructor() {
        const rpcUrl = process.env.NEXT_PUBLIC_NETWORK === 'polygon-mainnet' 
          ? `https://polygon-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || 'Gc18loKVH6D9R4tmbyK5P'}`
          : `https://polygon-amoy.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || 'Gc18loKVH6D9R4tmbyK5P'}`;
    
    this.provider = new JsonRpcProvider(rpcUrl);
  }

  // Set signer for transactions
  setSigner(signer: Wallet) {
    this.signer = signer;
  }

  // Get contract instance
  getContract(address: string, abi: readonly string[]): Contract {
    if (this.signer) {
      return new Contract(address, abi, this.signer);
    }
    return new Contract(address, abi, this.provider);
  }

  // EMOTI Token contract
  getEmotiToken(): Contract {
    if (!CONTRACT_ADDRESSES.EMOTI_TOKEN) {
      throw new Error('EMOTI Token contract address not set');
    }
    return this.getContract(CONTRACT_ADDRESSES.EMOTI_TOKEN, EMOTI_TOKEN_ABI);
  }

  // Emotion Oracle contract
  getEmotionOracle(): Contract {
    if (!CONTRACT_ADDRESSES.EMOTION_ORACLE) {
      throw new Error('Emotion Oracle contract address not set');
    }
    return this.getContract(CONTRACT_ADDRESSES.EMOTION_ORACLE, EMOTION_ORACLE_ABI);
  }

  // Emotion Validation contract
  getEmotionValidation(): Contract {
    if (!CONTRACT_ADDRESSES.EMOTION_VALIDATION) {
      throw new Error('Emotion Validation contract address not set');
    }
    return this.getContract(CONTRACT_ADDRESSES.EMOTION_VALIDATION, EMOTION_VALIDATION_ABI);
  }

  // Emotion Data Storage contract
  getEmotionDataStorage(): Contract {
    if (!CONTRACT_ADDRESSES.EMOTION_DATA_STORAGE) {
      throw new Error('Emotion Data Storage contract address not set');
    }
    return this.getContract(CONTRACT_ADDRESSES.EMOTION_DATA_STORAGE, EMOTION_DATA_STORAGE_ABI);
  }

  // Submit emotion data
  async submitEmotionData(emotionType: number, intensity: number, confidence: number, context: string) {
    if (!this.signer) {
      throw new Error('Signer not set');
    }

    const oracle = this.getEmotionOracle();
    const tx = await oracle.submitEmotionData(emotionType, intensity, confidence, context);
    return await tx.wait();
  }

  // Register as validator
  async registerValidator(stakeAmount: string) {
    if (!this.signer) {
      throw new Error('Signer not set');
    }

    const oracle = this.getEmotionOracle();
    const tx = await oracle.registerValidator({ value: ethers.parseEther(stakeAmount) });
    return await tx.wait();
  }

  // Validate emotion data
  async validateEmotionData(dataId: number, isValid: boolean) {
    if (!this.signer) {
      throw new Error('Signer not set');
    }

    const oracle = this.getEmotionOracle();
    const tx = await oracle.validateEmotionData(dataId, isValid);
    return await tx.wait();
  }

  // Get emotion data
  async getEmotionData(dataId: number) {
    const oracle = this.getEmotionOracle();
    return await oracle.getEmotionData(dataId);
  }

  // Get validator info
  async getValidatorInfo(validatorAddress: string) {
    const oracle = this.getEmotionOracle();
    return await oracle.getValidatorInfo(validatorAddress);
  }

  // Get token balance
  async getTokenBalance(address: string) {
    const token = this.getEmotiToken();
    return await token.balanceOf(address);
  }

  // Transfer tokens
  async transferTokens(to: string, amount: string) {
    if (!this.signer) {
      throw new Error('Signer not set');
    }

    const token = this.getEmotiToken();
    const tx = await token.transfer(to, ethers.parseEther(amount));
    return await tx.wait();
  }
}

// Export singleton instance
export const contractService = new ContractService();
