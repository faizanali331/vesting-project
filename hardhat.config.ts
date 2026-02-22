// import { HardhatUserConfig } from "hardhat/config";
// import "@nomicfoundation/hardhat-toolbox";

// const config: HardhatUserConfig = {
//   solidity: {
//     version: "0.8.21",
//     settings: {
//       optimizer: {
//         enabled: true,
//         runs: 200
//       }
//     }
//   },
//   defaultNetwork: "localhost",
//   networks: {
//     localhost: {
//       url: "http://127.0.0.1:8545"
//     }
//   }
// };

// export default config;

import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.21",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },

  networks: {
    hardhat: {
      mining: {
        auto: true,
        interval: 5000, // ⬅ mine a block every 5 seconds
      },
    },

    localhost: {
      url: "http://127.0.0.1:8545",
    },
  },
};

export default config;