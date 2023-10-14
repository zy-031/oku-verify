import { Contract } from "ethers"
import { task, types } from "hardhat/config"

task("deploy:okuCheck", "Deploy a OkuCheck & its Verifier contract")
  .addOptionalParam<boolean>("logs", "Logs ", true, types.boolean)
  .setAction(async ({ logs }, { ethers }): Promise<Contract> => {
    const Verifier = await ethers.getContractFactory("Verifier")
    const ContractFactory = await ethers.getContractFactory("OkuCheck")
    // const [owner] = await ethers.getSigners()

    const verifierContract = await Verifier.deploy()
    await verifierContract.deployed()

    const contract = await ContractFactory.deploy(verifierContract.address)
    await contract.deployed()

    logs && console.log(`Oku Check contract has been deployed to: ${contract.address}`)

    return contract
  })
