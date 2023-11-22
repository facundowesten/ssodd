const ethers = require("ethers");
const editJsonFile = require("edit-json-file");

const walletsFile = editJsonFile(`${__dirname}/wallets.json`);

const wallets = walletsFile.toObject();

const filteredWallets = wallets.filter((wallet) => !wallet.sushiSwapped);

const web3RpcUrl =
  "https://arb-mainnet.g.alchemy.com/v2/wbRchEmhznjAmXgaLSlq8uqLtvJWY7tv"; // The URL for the BSC node you want to connect to
const provider = new ethers.providers.JsonRpcProvider(web3RpcUrl); // Create a provider for interacting with the BSC node

const contract = new ethers.Contract(
  "0x09bd2a33c47746ff03b86bce4e885d03c74a8e8c",
  require("./abi.json"),
  provider
);
(async () => {
  for (let x = 0; x < filteredWallets.length; x++) {
    try{

    const wallet = filteredWallets[x];
    const walletIndex = wallets.indexOf(wallet);
    const signer = new ethers.Wallet(wallet.privateKey, provider);
    const data = await fetch(
      `https://swap.sushi.com/v3.2?chainId=42161&tokenIn=0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE&tokenOut=0x912CE59144191C1204E64559FE8253a0e49E6548&amount=100000000000&maxPriceImpact=0.005&gasPrice=100000000&to=${signer.address}&preferSushi=true`,
      {
        headers: {
          accept: "*/*",
          "accept-language": "en-US,en;q=0.9,es-US;q=0.8,es;q=0.7",
          "if-none-match": 'W/"b8b-vHRTLl2R7TCOyGoP0pbel0L4zUQ"',
          "sec-ch-ua":
            '"Google Chrome";v="119", "Chromium";v="119", "Not?A_Brand";v="24"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Windows"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-site",
          Referer: "https://www.sushi.com/",
          "Referrer-Policy": "strict-origin-when-cross-origin",
        },
        body: null,
        method: "GET",
      }
    )
      .then((res) => res.json())
      .then((res) => JSON.parse(res));

    const tx = await contract
      .connect(signer)
      .processRoute(
        data.args.tokenIn,
        data.args.amountIn.split(".")[1],
        data.args.tokenOut,
        data.args.amountOutMin.split(".")[1],
        data.args.to,
        data.args.routeCode,
        {
          gasPrice: ethers.utils.parseUnits("0.1", "gwei"),
          value: data.args.value.split(".")[1],
        }
      ).then(
        (tx) => {
          console.log(tx.hash);
            walletsFile.set(`${walletIndex}.sushiSwapped`, true);
         
        }
      );
    }
    catch(e){
        console.log(e);
    }
  }
})();
