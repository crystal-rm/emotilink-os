// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title EMOTI Token
 * @dev Basic ERC20 token for EmotiLink OS Phase 1
 * @author EmotiLink OS Team
 */
contract EMOTIToken is ERC20, ERC20Burnable, Ownable, ReentrancyGuard, Pausable {
    
    // Events
    event TokensMinted(address indexed to, uint256 amount);
    event TokensBurned(address indexed from, uint256 amount);
    
    // State variables
    uint256 public constant INITIAL_SUPPLY = 100_000_000 * 10**18; // 100M EMOTI
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18; // 1B EMOTI max
    
    address public emotionOracle;
    
    // Modifiers
    modifier onlyOracle() {
        require(msg.sender == emotionOracle, "Only oracle can call this function");
        _;
    }
    
    constructor() ERC20("EmotiLink OS Token", "EMOTI") Ownable(msg.sender) {
        _mint(msg.sender, INITIAL_SUPPLY);
    }
    
    /**
     * @dev Set oracle contract address
     * @param _oracle Address of the emotion oracle contract
     */
    function setOracle(address _oracle) external onlyOwner {
        require(_oracle != address(0), "Invalid oracle address");
        emotionOracle = _oracle;
    }
    
    /**
     * @dev Mint tokens (only owner)
     * @param _to Address to mint tokens to
     * @param _amount Amount of tokens to mint
     */
    function mint(address _to, uint256 _amount) external onlyOwner {
        require(totalSupply() + _amount <= MAX_SUPPLY, "Exceeds maximum supply");
        _mint(_to, _amount);
        emit TokensMinted(_to, _amount);
    }
    
    /**
     * @dev Burn tokens
     * @param _amount Amount of tokens to burn
     */
    function burn(uint256 _amount) public override {
        super.burn(_amount);
        emit TokensBurned(msg.sender, _amount);
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
}