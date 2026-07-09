// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract ChestFiERC20 is ERC20, ERC20Burnable, Ownable {
    uint8 private immutable tokenDecimals;

    constructor(
        string memory tokenName,
        string memory tokenSymbol,
        uint8 decimals_,
        uint256 initialSupply,
        address initialOwner
    ) ERC20(tokenName, tokenSymbol) Ownable(initialOwner) {
        tokenDecimals = decimals_;
        _mint(initialOwner, initialSupply);
    }

    function decimals() public view override returns (uint8) {
        return tokenDecimals;
    }
}

contract ChestFiTokenFactory is Ownable, ReentrancyGuard {
    address payable public feeRecipient;
    uint256 public feeAmount;

    address[] public deployedTokens;
    mapping(address token => bool deployed) public isDeployedToken;

    event TokenCreated(
        address indexed token,
        address indexed creator,
        address indexed owner,
        string name,
        string symbol,
        uint8 decimals,
        uint256 totalSupply,
        uint256 mintedAmount
    );
    event FeeAmountUpdated(uint256 oldFee, uint256 newFee);
    event FeeRecipientUpdated(address indexed oldRecipient, address indexed newRecipient);

    constructor(address payable initialFeeRecipient, uint256 initialFeeAmount) Ownable(msg.sender) {
        require(initialFeeRecipient != address(0), "Fee recipient is zero");

        feeRecipient = initialFeeRecipient;
        feeAmount = initialFeeAmount;
    }

    function setFeeAmount(uint256 newFee) external onlyOwner {
        uint256 oldFee = feeAmount;
        feeAmount = newFee;
        emit FeeAmountUpdated(oldFee, newFee);
    }

    function setFeeRecipient(address payable newRecipient) external onlyOwner {
        require(newRecipient != address(0), "Fee recipient is zero");

        address oldRecipient = feeRecipient;
        feeRecipient = newRecipient;
        emit FeeRecipientUpdated(oldRecipient, newRecipient);
    }

    function createToken(
        string memory name,
        string memory symbol,
        uint8 decimals_,
        uint256 totalSupply,
        address tokenOwner
    ) external payable nonReentrant returns (address) {
        require(bytes(name).length > 0, "Name is empty");
        require(bytes(name).length <= 64, "Name too long");
        require(bytes(symbol).length >= 2 && bytes(symbol).length <= 12, "Invalid symbol");
        require(decimals_ <= 18, "Invalid decimals");
        require(totalSupply > 0, "Supply is zero");
        require(tokenOwner != address(0), "Owner is zero");
        require(msg.value == feeAmount, "Invalid fee");
        require(feeRecipient != address(0), "Fee recipient is zero");

        uint256 multiplier = 10 ** uint256(decimals_);
        require(totalSupply <= type(uint256).max / multiplier, "Supply overflow");
        uint256 mintedAmount = totalSupply * multiplier;

        ChestFiERC20 token = new ChestFiERC20(name, symbol, decimals_, mintedAmount, tokenOwner);
        address tokenAddress = address(token);

        deployedTokens.push(tokenAddress);
        isDeployedToken[tokenAddress] = true;

        emit TokenCreated(tokenAddress, msg.sender, tokenOwner, name, symbol, decimals_, totalSupply, mintedAmount);

        if (msg.value > 0) {
            (bool sent, ) = feeRecipient.call{value: msg.value}("");
            require(sent, "Fee transfer failed");
        }

        return tokenAddress;
    }

    function getDeployedTokensCount() external view returns (uint256) {
        return deployedTokens.length;
    }

    function getDeployedToken(uint256 index) external view returns (address) {
        require(index < deployedTokens.length, "Index out of bounds");
        return deployedTokens[index];
    }

    function getDeployedTokens(uint256 offset, uint256 limit) external view returns (address[] memory) {
        if (offset >= deployedTokens.length) {
            return new address[](0);
        }

        if (limit > 100) {
            limit = 100;
        }

        uint256 remaining = deployedTokens.length - offset;
        uint256 size = limit < remaining ? limit : remaining;
        address[] memory tokens = new address[](size);

        for (uint256 i = 0; i < size; i++) {
            tokens[i] = deployedTokens[offset + i];
        }

        return tokens;
    }
}
