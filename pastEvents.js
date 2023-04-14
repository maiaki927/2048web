var steps; //存棋子步驟
var chart; //獎金時間圖
var stakelist; //獎金
const etherscanApiKey = "";


//取得Play的歷史Events 為了製作排行榜與畫圖
async function getPastEvents() {
  const events = await myContract.getPastEvents("Play", {
    fromBlock: 0,
    toBlock: "latest",
  });
  //取得玩家與積分
  const playerScores = events.reduce((acc, event) => {
    const player = event.returnValues.player;
    const score = event.returnValues.score;

    // 檢查是否已經存在這個玩家的分數
    const playerIndex = acc.findIndex((p) => p.player === player);

    // 如果玩家不存在，則添加一個新的對象到陣列中
    if (playerIndex === -1) {
      acc.push({
        player: player,
        scores: [score], // 將分數存為一個陣列，方便後續計算最高分
      });
    } else {
      // 如果玩家已經存在，則將分數添加到該玩家的分數陣列中
      acc[playerIndex].scores.push(score);
    }

    return acc;
  }, []);

  playerScores.sort((a, b) => Math.max(...b.scores) - Math.max(...a.scores));

  // 如果第一名和第三名是同個玩家，只留下這個玩家第一名的紀錄
  const groupedPlayerScores = [];
  let lastPlayer = null;

  for (const playerScore of playerScores) {
    if (lastPlayer === playerScore.player) {
      continue; // 如果這個玩家已經被添加到陣列中，則跳過這次循環
    }

    lastPlayer = playerScore.player;
    groupedPlayerScores.push(playerScore);
  }
  const leaderboard = document.getElementById("leaderboard");

  //每次先清除資料
  leaderboard.querySelector("ol").innerHTML = "";
  // 將所有玩家得分加到排行榜中
  playerScores.forEach((item, index) => {
    const li = document.createElement("li");
    li.innerHTML = `<span>第 ${index + 1} 名：</span> <span>${
      item.player
    }</span> <span>得分：${item.scores}</span>`;
    leaderboard.querySelector("ol").appendChild(li);
  });

  //取得每次增加的錢
  stakelist = events.map((event) => {
    return {
      blockNumber: event.blockNumber,
      stake: event.returnValues.stake,
    };
  });
  
  //歷史紀錄等初始呈現
  if (!(chart instanceof Chart)) {
    draw();
    getHistory();
    renderStep();
  }
}

//畫獎金時間圖
function draw() {
  // 使用 Chart.js 繪製時間走勢圖

  // 計算數值軸累加數據
  var cummulativeData = [];
  let cummulativeSum = 1;
  for (let i = 0; i < stakelist.length; i++) {
    cummulativeSum += parseFloat(
      web3.utils.fromWei(stakelist[i].stake, "ether")
    );
    cummulativeData.push({ x: stakelist[i].blockNumber, y: cummulativeSum });
  }
  console.log(cummulativeData);

  if (chart instanceof Chart) {
    chart.destroy();
  }
  var ctx = document.getElementById("myChart").getContext("2d");

  chart = new Chart(ctx, {
    type: "line",
    data: {
      datasets: [
        {
          label: "Cummulative Data",
          data: cummulativeData,
          borderColor: "orange",
          backgroundColor: "white",
        },
      ],
    },
    options: {
      scales: {
        x: {
          type: "linear",
          title: {
            display: true,
            text: "blockNumber",
            color: "orange",
          },
        },
        y: {
          title: {
            display: true,
            text: "stake",
            color: "orange",
          },
        },
      },
    },
  });
}
function getData() {
  document.querySelector(".grid").innerHTML = "";
  var tx = document.getElementById("tx").value;
  const apiUrl = "https://genftai.glitch.me/api/getdata?address=" + tx;

  fetch(apiUrl)
    .then((response) => response.json())
    .then((data) => {
      steps = data.message;
      renderStep();
    })
    .catch((error) => {
      alert("請輸入正確的Internal Transactions Hash");
      console.error(error);
    });
}

//畫棋子
var currentStep = 0;

function renderStep() {
  const matrix = steps[currentStep];
  const grid = document.querySelector(".grid");
  grid.innerHTML = "";
  for (let i = 0; i < matrix.length; i++) {
    for (let j = 0; j < matrix[i].length; j++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");
      cell.innerText = matrix[i][j];
      grid.appendChild(cell);
    }
  }
  showgrid();
}

function prevStep() {
  if (currentStep > 0) {
    currentStep--;
    renderStep();
  }
}

function nextStep() {
  if (currentStep < steps.length - 1) {
    currentStep++;
    renderStep();
  }
}

//取得合約每筆交易觸發的event做歷史紀錄
function getHistory() {
  web3.eth
    .getBlockNumber()
    .then((blockNumber) => {
      
      const apiUrl =
        "https://api-goerli.etherscan.io/api?module=account&action=txlist&address=" +
        Contractaddress +
        "&startblock=0&endblock=" +
        blockNumber +
        "&sort=asc&apikey=" +
        etherscanApiKey;

      fetch(apiUrl)
        .then((response) => response.json())
        .then((data) => {
          data.result.sort((a, b) => a.timeStamp - b.timeStamp);
          console.log("data", data.result);
          processLogs(data);
        })
        .catch((error) => {
          console.error(error);
        });
    })
    .catch((error) => {
      console.error(error);
    });
}

//顯示歷史資訊
async function processLogs(data) {
  const receipts = [];
  for (let i = 0; i < data.result.length; i++) {
    const receipt = await web3.eth.getTransactionReceipt(data.result[i].hash);
    receipts.push(receipt);
  }

  for (let i = 0; i < receipts.length; i++) {
    const logs = receipts[i].logs;
    logs.forEach((log) => {
      const event = abix.find((e) => e.signature === log.topics[0]);
      const decoded = web3.eth.abi.decodeLog(
        event.inputs,
        log.data,
        log.topics.slice(1)
      );
      console.log(event.name, decoded);
      if (event.name == "Play") {
        var table = document.getElementById("myTable");
        var row = table.insertRow(); // 新建一行
        var rowData = decoded;

        // 建立每一個表格儲存格，填入相應的值
        var gasUsed = data.result[i].gasUsed;
        var timeStamp = new Date(data.result[i].timeStamp * 1000);

        row.insertCell().innerHTML = timeStamp.toLocaleString();
        row.insertCell().innerHTML = rowData.player;
        row.insertCell().innerHTML = rowData.solver;
        row.insertCell().innerHTML = gasUsed;
        row.insertCell().innerHTML = rowData.score;
        row.insertCell().innerHTML = logs.length > 1 ? "是" : "否";
      }
    });
  }
}
