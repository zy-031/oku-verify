import { expect } from "chai"
import { Signer } from "ethers"
import { ethers } from "hardhat"
import { OkuCheck } from "../build/typechain/OkuCheck"
import { groth16 } from "snarkjs"

describe("OkuCheck", () => {
  let okuCheckContract: OkuCheck
  let accounts: Signer[]

  before(async () => {
    const verifierContract = await ethers.getContractFactory("Verifier")
    accounts = await ethers.getSigners()

    const verifierDeployed = await verifierContract.deploy()
    console.log("verifierContract", verifierDeployed.address)

    const okuCheck = await ethers.getContractFactory("OkuCheck")
    okuCheckContract = await okuCheck.deploy(verifierDeployed.address)
    console.log("okuCheckContract", okuCheckContract.address)
  })

  it("Should verify if oku is above 18", async () => {
    const wasmFilePath = "./build/snark/circuit.wasm"
    const finalZkeyPath = "./build/snark/circuit_final.zkey"
    const oku = 21
    const okuLimit = BigInt(18)
    const witness = {
      oku,
      okuLimit
    }

    const { proof, publicSignals } = await groth16.fullProve(witness, wasmFilePath, finalZkeyPath, null)

    // TODO: optimize
    const solidityProof = [
      proof.pi_a[0],
      proof.pi_a[1],
      proof.pi_b[0][1],
      proof.pi_b[0][0],
      proof.pi_b[1][1],
      proof.pi_b[1][0],
      proof.pi_c[0],
      proof.pi_c[1]
    ]

    const transaction = okuCheckContract.connect(accounts[0]).verifyOku(solidityProof, publicSignals)
    console.log("transaction", transaction)
    //    await expect(transaction).to.be.revertedWith("Below oku limit")

    await expect(transaction)
      .to.emit(okuCheckContract, "OkuVerfied")
      .withArgs(await accounts[0].getAddress(), true)
  })
})
