const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EmotionOracle", function () {
  let emotionOracle;
  let owner;
  let validator1;
  let validator2;
  let user1;

  beforeEach(async function () {
    [owner, validator1, validator2, user1] = await ethers.getSigners();

    const EmotionOracle = await ethers.getContractFactory("EmotionOracle");
    emotionOracle = await EmotionOracle.deploy();
    await emotionOracle.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await emotionOracle.owner()).to.equal(owner.address);
    });

    it("Should initialize with correct default values", async function () {
      expect(await emotionOracle.minimumStake()).to.equal(ethers.parseEther("0.1"));
      expect(await emotionOracle.validationThreshold()).to.equal(3);
      expect(await emotionOracle.validationReward()).to.equal(ethers.parseEther("0.01"));
    });
  });

  describe("Emotion Data Submission", function () {
    it("Should allow users to submit emotion data", async function () {
      const emotionType = 0; // joy
      const intensity = 8;
      const confidence = 85;
      const context = "Feeling great after completing a project";

      await expect(
        emotionOracle.connect(user1).submitEmotionData(
          emotionType,
          intensity,
          confidence,
          context
        )
      ).to.emit(emotionOracle, "EmotionDataSubmitted")
        .withArgs(1, user1.address, emotionType, intensity, await getBlockTimestamp());

      const data = await emotionOracle.getEmotionData(1);
      expect(data.emotionType).to.equal(emotionType);
      expect(data.intensity).to.equal(intensity);
      expect(data.confidence).to.equal(confidence);
      expect(data.context).to.equal(context);
      expect(data.submitter).to.equal(user1.address);
    });

    it("Should reject invalid emotion types", async function () {
      await expect(
        emotionOracle.connect(user1).submitEmotionData(
          6, // invalid emotion type
          8,
          85,
          "Invalid emotion"
        )
      ).to.be.revertedWith("Invalid emotion type");
    });

    it("Should reject invalid intensity values", async function () {
      await expect(
        emotionOracle.connect(user1).submitEmotionData(
          0,
          11, // invalid intensity
          85,
          "Invalid intensity"
        )
      ).to.be.revertedWith("Invalid intensity value");
    });

    it("Should reject invalid confidence values", async function () {
      await expect(
        emotionOracle.connect(user1).submitEmotionData(
          0,
          8,
          101, // invalid confidence
          "Invalid confidence"
        )
      ).to.be.revertedWith("Invalid confidence value");
    });
  });

  describe("Validator Registration", function () {
    it("Should allow users to register as validators", async function () {
      const stakeAmount = ethers.parseEther("0.1");

      await expect(
        emotionOracle.connect(validator1).registerValidator({ value: stakeAmount })
      ).to.emit(emotionOracle, "ValidatorRegistered")
        .withArgs(validator1.address, stakeAmount, await getBlockTimestamp());

      const validator = await emotionOracle.getValidator(validator1.address);
      expect(validator.isActive).to.be.true;
      expect(validator.stakeAmount).to.equal(stakeAmount);
      expect(validator.reputationScore).to.equal(100);
    });

    it("Should reject registration with insufficient stake", async function () {
      const insufficientStake = ethers.parseEther("0.05");

      await expect(
        emotionOracle.connect(validator1).registerValidator({ value: insufficientStake })
      ).to.be.revertedWith("Insufficient stake amount");
    });

    it("Should prevent double registration", async function () {
      const stakeAmount = ethers.parseEther("0.1");

      await emotionOracle.connect(validator1).registerValidator({ value: stakeAmount });

      await expect(
        emotionOracle.connect(validator1).registerValidator({ value: stakeAmount })
      ).to.be.revertedWith("Already registered as validator");
    });
  });

  describe("Data Validation", function () {
    beforeEach(async function () {
      // Register validators
      await emotionOracle.connect(validator1).registerValidator({ value: ethers.parseEther("0.1") });
      await emotionOracle.connect(validator2).registerValidator({ value: ethers.parseEther("0.1") });

      // Submit test data
      await emotionOracle.connect(user1).submitEmotionData(0, 8, 85, "Test emotion");
    });

    it("Should allow validators to validate data", async function () {
      await expect(
        emotionOracle.connect(validator1).validateEmotionData(1, true)
      ).to.emit(emotionOracle, "EmotionDataValidated")
        .withArgs(1, validator1.address, true, await getBlockTimestamp());

      const data = await emotionOracle.getEmotionData(1);
      expect(data.isValidated).to.be.true;
    });

    it("Should reject validation from non-validators", async function () {
      await expect(
        emotionOracle.connect(user1).validateEmotionData(1, true)
      ).to.be.revertedWith("Not an active validator");
    });

    it("Should prevent double validation", async function () {
      await emotionOracle.connect(validator1).validateEmotionData(1, true);

      await expect(
        emotionOracle.connect(validator2).validateEmotionData(1, false)
      ).to.be.revertedWith("Data already validated");
    });
  });

  describe("Owner Functions", function () {
    it("Should allow owner to update minimum stake", async function () {
      const newMinimumStake = ethers.parseEther("0.2");

      await emotionOracle.setMinimumStake(newMinimumStake);
      expect(await emotionOracle.minimumStake()).to.equal(newMinimumStake);
    });

    it("Should allow owner to update validation threshold", async function () {
      const newThreshold = 5;

      await emotionOracle.setValidationThreshold(newThreshold);
      expect(await emotionOracle.validationThreshold()).to.equal(newThreshold);
    });

    it("Should allow owner to update validation reward", async function () {
      const newReward = ethers.parseEther("0.02");

      await emotionOracle.setValidationReward(newReward);
      expect(await emotionOracle.validationReward()).to.equal(newReward);
    });

    it("Should allow owner to pause/unpause contract", async function () {
      await emotionOracle.pause();
      expect(await emotionOracle.paused()).to.be.true;

      await emotionOracle.unpause();
      expect(await emotionOracle.paused()).to.be.false;
    });

    it("Should reject non-owner from calling owner functions", async function () {
      await expect(
        emotionOracle.connect(user1).setMinimumStake(ethers.parseEther("0.2"))
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Contract Statistics", function () {
    it("Should return correct contract statistics", async function () {
      // Submit some data
      await emotionOracle.connect(user1).submitEmotionData(0, 8, 85, "Test 1");
      await emotionOracle.connect(user1).submitEmotionData(1, 6, 75, "Test 2");

      // Register validators
      await emotionOracle.connect(validator1).registerValidator({ value: ethers.parseEther("0.1") });

      const stats = await emotionOracle.getContractStats();
      expect(stats.totalData).to.equal(2);
      expect(stats.totalValidators).to.equal(1);
      expect(stats.contractBalance).to.equal(ethers.parseEther("0.1"));
    });
  });

  // Helper function to get current block timestamp
  async function getBlockTimestamp() {
    const block = await ethers.provider.getBlock("latest");
    return block.timestamp;
  }
});