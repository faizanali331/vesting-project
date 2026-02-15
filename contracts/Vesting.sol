// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
contract Vesting is Ownable, ReentrancyGuard {
    IERC20 public token;
    uint256 public totalVestedAmount;

    constructor(address _token) Ownable() {
        token = IERC20(_token);
    }

    event VestingScheduleCreated(
        address indexed beneficiary,
        uint256 start,
        uint256 cliff,
        uint256 duration,
        uint256 amount
    );
    event TokenReleased(address indexed beneficiary, uint256 amount);

    struct VestingSchedule {
        uint256 cliff;
        uint256 start;
        uint256 duration;
        uint256 amount;
        uint256 released;
    }

    mapping(address => VestingSchedule) public VestingSchedules;

    function createVestingSchedule(
        // to be corrected
        address beneficiary,
        uint256 start,
        uint256 cliffDuration,
        uint256 duration,
        uint256 amount
    ) external onlyOwner {
        require(start >= block.timestamp, "Start in past");
        require(duration > 0, "Duration must be > 0");
        require(amount > 0, "Amount must be > 0");
        require(beneficiary != address(0), "Invalid address");
        require(cliffDuration <= duration, "clliffDuration>duration");
        require(
            totalVestedAmount + amount <= token.balanceOf(address(this)),
            "Balance low"
        );
        require(
            VestingSchedules[beneficiary].amount == 0,
            "Schedule already exists"
        );

        VestingSchedules[beneficiary].start = start;
        VestingSchedules[beneficiary].cliff = cliffDuration + start;
        VestingSchedules[beneficiary].duration = duration;
        VestingSchedules[beneficiary].amount = amount;
        VestingSchedules[beneficiary].released = 0;

        emit VestingScheduleCreated(
            beneficiary,
            start,
            start + cliffDuration,
            duration,
            amount
        );
        totalVestedAmount += amount;
    }
    function release(uint256 amount) external nonReentrant {
        VestingSchedule storage vesting = VestingSchedules[msg.sender];
        require(vesting.amount > 0, "No vesting schedule");

        uint256 claimableAmount = vestedAmount(msg.sender) - vesting.released;
        require(claimableAmount > 0, "Nothing claimable");
        require(amount <= claimableAmount, "Cannot claim more than available");

        totalVestedAmount -= amount;
        vesting.released += amount;
        //token.transfer(msg.sender, amount);
        require(token.transfer(msg.sender, amount), "Transfer failed");

        emit TokenReleased(msg.sender, amount);
    }

    function vestedAmount(address beneficiary) public view returns (uint256) {
        VestingSchedule storage vesting = VestingSchedules[beneficiary];
        if (vesting.cliff > block.timestamp) return 0;
        else if (vesting.start + vesting.duration <= block.timestamp)
            return vesting.amount;
        else {
            uint256 timePassed = block.timestamp - vesting.start;
            return (vesting.amount * timePassed) / vesting.duration;
            //return Math.mulDiv(vesting.amount, timePassed, vesting.duration);
        }
    }
}
