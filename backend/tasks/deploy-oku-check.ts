import { Contract } from "ethers"
import { task, types } from "hardhat/config"

task("deploy:okuCheck", "Deploy a OkuCheck & its Verifier contract")
  .addOptionalParam<boolean>("logs", "Logs ", true, types.boolean)
  .setAction(async ({ logs }, { ethers }): Promise<Contract> => {
    const [owner] = await ethers.getSigners()
    console.log(owner.address)
    console.log((await owner.getBalance()).toString())
    const balanceWei = (await owner.getBalance()).toString()
    const balanceEther = await ethers.utils.formatEther(balanceWei);
    console.log(balanceEther);
    console.log(`The balance is ${balanceEther} ether.`);
    const Verifier = await ethers.getContractFactory("Verifier")
    const transaction = await Verifier.getDeployTransaction()
    const gasPrice = await ethers.provider.getGasPrice()
    const gasLimit = await ethers.provider.estimateGas(transaction)
    const totalCost = await gasPrice.mul(gasLimit)
    console.log(`The total cost is ${ethers.utils.formatEther(totalCost)} ether`)
    const ContractFactory = await ethers.getContractFactory("OkuCheck")
    // const [owner] = await ethers.getSigners()

    const verifierContract = await Verifier.deploy()
    await verifierContract.deployed()

    const contract = await ContractFactory.deploy(verifierContract.address)
    await contract.deployed()

    logs && console.log(`Oku Check contract has been deployed to: ${contract.address}`)

    return contract
  })
