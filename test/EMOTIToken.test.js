const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EMOTI Token", function () {
  let emotiToken;
  let owner;
  let user1;
  let user2;
  let oracle;

  beforeEach(async function () {
    [owner, user1, user2, oracle] = await ethers.getSigners();

    const EMOTIToken = await ethers.getContractFactory("EMOTIToken");
    emotiToken = await EMOTIToken.deploy();
    await emotiToken.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right name and symbol", async function () {
      expect(await emotiToken.name()).to.equal("EmotiLink OS Token");
      expect(await emotiToken.symbol()).to.equal("EMOTI");
    });

    it("Should set the right owner", async function () {
      expect(await emotiToken.owner()).to.equal(owner.address);
    });

    it("Should mint initial supply to owner", async function () {
      const initialSupply = ethers.parseEther("100000000"); // 100M EMOTI
      expect(await emotiToken.balanceOf(owner.address)).to.equal(initialSupply);
    });
  });

  describe("Token Operations", function () {
    it("Should allow owner to mint tokens", async function () {
      const mintAmount = ethers.parseEther("1000");
      
      await expect(
        emotiToken.mint(user1.address, mintAmount)
      ).to.emit(emotiToken, "TokensMinted")
        .withArgs(user1.address, mintAmount);

      expect(await emotiToken.balanceOf(user1.address)).to.equal(mintAmount);
    });

    it("Should allow users to burn tokens", async function () {
      const burnAmount = ethers.parseEther("1000");
      
      // Transfer tokens to user1 first
      await emotiToken.transfer(user1.address, burnAmount);
      
      await expect(
        emotiToken.connect(user1).burn(burnAmount)
      ).to.emit(emotiToken, "TokensBurned")
        .withArgs(user1.address, burnAmount);

      expect(await emotiToken.balanceOf(user1.address)).to.equal(0);
    });

    it("Should reject minting beyond max supply", async function () {
      const excessiveAmount = ethers.parseEther("1000000000"); // 1B EMOTI (max supply)
      
      await expect(
        emotiToken.mint(user1.address, excessiveAmount)
      ).to.be.revertedWith("Exceeds maximum supply");
    });
  });

  describe("Oracle Integration", function () {
    beforeEach(async function () {
      await emotiToken.setOracle(oracle.address);
    });

    it("Should set oracle address", async function () {
      expect(await emotiToken.emotionOracle()).to.equal(oracle.address);
    });

    it("Should reject non-owner from setting oracle", async function () {
      await expect(
        emotiToken.connect(user1).setOracle(user2.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Access Control", function () {
    it("Should allow owner to pause/unpause", async function () {
      await emotiToken.pause();
      expect(await emotiToken.paused()).to.be.true;

      await emotiToken.unpause();
      expect(await emotiToken.paused()).to.be.false;
    });

    it("Should reject non-owner from pausing", async function () {
      await expect(
        emotiToken.connect(user1).pause()
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
});