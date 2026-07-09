// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract ChestFiTokenLocker is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct LockInfo {
        address token;
        uint256 amount;
        uint256 withdrawn;
        uint256 lockUntil;
        address owner;
    }

    uint256 public feeAmount;
    address payable public feeRecipient;
    uint256 public nextLockId = 1;

    mapping(uint256 lockId => LockInfo) public locks;
    mapping(address token => uint256 totalLocked) public totalLockedByToken;

    mapping(address user => uint256[] lockIds) private userLocks;
    mapping(address token => uint256[] lockIds) private tokenLocks;

    event Locked(
        uint256 indexed lockId,
        address indexed owner,
        address indexed token,
        uint256 amount,
        uint256 lockUntil
    );
    event Withdrawn(uint256 indexed lockId, address indexed owner, uint256 amount);
    event FeeAmountUpdated(uint256 newFee);
    event FeeRecipientUpdated(address newRecipient);

    constructor(address payable initialFeeRecipient, uint256 initialFeeAmount) Ownable(msg.sender) {
        require(initialFeeRecipient != address(0), "Fee recipient is zero");

        feeRecipient = initialFeeRecipient;
        feeAmount = initialFeeAmount;
    }

    function setFeeAmount(uint256 newFee) external onlyOwner {
        feeAmount = newFee;
        emit FeeAmountUpdated(newFee);
    }

    function setFeeRecipient(address payable newRecipient) external onlyOwner {
        require(newRecipient != address(0), "Fee recipient is zero");

        feeRecipient = newRecipient;
        emit FeeRecipientUpdated(newRecipient);
    }

    function lock(address token, uint256 amount, uint256 lockUntil) external payable nonReentrant {
        require(token != address(0), "Token is zero");
        require(amount > 0, "Amount is zero");
        require(lockUntil > block.timestamp, "Unlock time not future");
        require(msg.value == feeAmount, "Invalid fee");
        require(feeRecipient != address(0), "Fee recipient is zero");

        IERC20 lockToken = IERC20(token);

        uint256 balanceBefore = lockToken.balanceOf(address(this));
        lockToken.safeTransferFrom(msg.sender, address(this), amount);
        uint256 received = lockToken.balanceOf(address(this)) - balanceBefore;
        require(received == amount, "Unsupported token");

        uint256 lockId = nextLockId;
        nextLockId = lockId + 1;

        locks[lockId] = LockInfo({
            token: token,
            amount: amount,
            withdrawn: 0,
            lockUntil: lockUntil,
            owner: msg.sender
        });

        userLocks[msg.sender].push(lockId);
        tokenLocks[token].push(lockId);
        totalLockedByToken[token] += amount;

        emit Locked(lockId, msg.sender, token, amount, lockUntil);

        if (msg.value > 0) {
            (bool sent, ) = feeRecipient.call{value: msg.value}("");
            require(sent, "Fee transfer failed");
        }
    }

    function withdraw(uint256 lockId) external nonReentrant {
        LockInfo storage lockInfo = locks[lockId];

        require(lockInfo.owner == msg.sender, "Not lock owner");
        require(block.timestamp >= lockInfo.lockUntil, "Lock not expired");

        uint256 remaining = lockInfo.amount - lockInfo.withdrawn;
        require(remaining > 0, "Nothing to withdraw");

        lockInfo.withdrawn = lockInfo.amount;
        totalLockedByToken[lockInfo.token] -= remaining;

        IERC20(lockInfo.token).safeTransfer(msg.sender, remaining);

        emit Withdrawn(lockId, msg.sender, remaining);
    }

    function withdrawable(uint256 lockId) external view returns (uint256) {
        LockInfo storage lockInfo = locks[lockId];

        if (lockInfo.owner == address(0) || block.timestamp < lockInfo.lockUntil) {
            return 0;
        }

        return lockInfo.amount - lockInfo.withdrawn;
    }

    function getUserLocks(address user) external view returns (uint256[] memory) {
        return userLocks[user];
    }

    function getTokenLocks(address token) external view returns (uint256[] memory) {
        return tokenLocks[token];
    }
}
