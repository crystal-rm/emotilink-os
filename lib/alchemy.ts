import { Alchemy, Network } from 'alchemy-sdk';

// Alchemy configuration
const alchemyConfig = {
  apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || 'Gc18loKVH6D9R4tmbyK5P',
  network: process.env.NEXT_PUBLIC_NETWORK === 'polygon-mainnet' ? Network.MATIC_MAINNET : Network.MATIC_AMOY,
};

// Create Alchemy instance
export const alchemy = new Alchemy(alchemyConfig);

// Network configuration
export const networkConfig = {
  polygonAmoy: {
    chainId: 80002,
    name: 'Polygon Amoy',
    rpcUrl: 'https://polygon-amoy.g.alchemy.com/v2/Gc18loKVH6D9R4tmbyK5P',
    blockExplorer: 'https://amoy.polygonscan.com',
  },
  polygonMainnet: {
    chainId: 137,
    name: 'Polygon Mainnet',
    rpcUrl: 'https://polygon-mainnet.g.alchemy.com/v2/Gc18loKVH6D9R4tmbyK5P',
    blockExplorer: 'https://polygonscan.com',
  },
};

// Get current network configuration
export function getCurrentNetwork() {
  const network = process.env.NEXT_PUBLIC_NETWORK || 'polygon-amoy';
  return network === 'polygon-mainnet' ? networkConfig.polygonMainnet : networkConfig.polygonAmoy;
}

// Utility functions for blockchain interactions
export class AlchemyService {
  private alchemy: Alchemy;

  constructor() {
    this.alchemy = alchemy;
  }

  // Get account balance
  async getBalance(address: string): Promise<string> {
    try {
      const balance = await this.alchemy.core.getBalance(address);
      return balance.toString();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error getting balance:', error);
      throw error;
    }
  }

  // Get transaction details
  async getTransaction(txHash: string) {
    try {
      return await this.alchemy.core.getTransaction(txHash);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error getting transaction:', error);
      throw error;
    }
  }

  // Get block information
  async getBlock(blockNumber: number) {
    try {
      return await this.alchemy.core.getBlock(blockNumber);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error getting block:', error);
      throw error;
    }
  }

  // Get contract events
  async getContractEvents(contractAddress: string, fromBlock?: number, toBlock?: number) {
    try {
      return await this.alchemy.core.getLogs({
        address: contractAddress,
        fromBlock: fromBlock ? `0x${fromBlock.toString(16)}` : 'earliest',
        toBlock: toBlock ? `0x${toBlock.toString(16)}` : 'latest',
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error getting contract events:', error);
      throw error;
    }
  }

  // Get gas price
  async getGasPrice() {
    try {
      return await this.alchemy.core.getGasPrice();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error getting gas price:', error);
      throw error;
    }
  }

  // Estimate gas for transaction
  async estimateGas(transaction: {
    to?: string;
    from?: string;
    value?: string;
    data?: string;
    gasLimit?: string;
  }) {
    try {
      return await this.alchemy.core.estimateGas(transaction);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error estimating gas:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const alchemyService = new AlchemyService();
