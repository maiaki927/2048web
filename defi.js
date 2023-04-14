var Contractaddress = "0x0bb9a15dF879D66Ee3a1D57E888f13033e3904a1";
var web3;
var myContract;
var timestart = false;
var address;
var ethid;
var outtime;//儲存終止時間
var now = new Date().getTime(); ///1681739248000;
var oldJackpot=0; //存放舊獎金

// 取得累積獎金（合約餘額）
function getJackpot() {
  web3.eth.getBalance(Contractaddress, (err, balance) => {
    if (err) {
      console.error(err);
      return;
    }
    //獎金池更新 更新歷史資料跟畫圖
    if (oldJackpot!=0 && oldJackpot!=balance){
      draw();
      getHistory();     
    }
    oldJackpot=balance;
    JackpotId.innerHTML =
      "累積獎金: " + web3.utils.fromWei(balance, "ether") + " ETH";
  });
}

// 取得最高分數
function getHighestScore() {
  myContract.methods.highestScore().call(function (error, result) {
    Highest_scoreId.innerHTML = "目前最高分數: " + result;
  });
}

// 取得優勝地址
function getWinner() {
  myContract.methods.winner().call(function (error, result) {
    WinnerId.innerHTML = "目前優勝地址: " + result;
    //如果遊戲時間到了 是當前帳戶顯示提領
    if (getTimeOut()) {
      if (address.toLowerCase() == result.toLowerCase()) {
        showWinner();
      } else {
        DisWinner();
      }
    }
  });
}
//判斷時間是否到了 已截止為true
function getTimeOut() {
  if (now > outtime) {
    return true;
  } else {
    return false;
  }
}

// 取得計時器時間
function getTimer() {
  myContract.methods.endTime().call(function (error, endTime) {
    var countDownDate = new Date(endTime * 1000).getTime();

    //countDownDate=new Date(1681357900650).getTime();

    outtime = countDownDate;
    // 更新倒數時間
    const updateCountDown = setInterval(() => {
      now = new Date().getTime();
      const distance = countDownDate - now;

      // 計算日、時、分、秒
      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      // 在前端畫面上顯示倒數時間
      TimerId.innerHTML =
        "剩餘 " +
        days +
        " 天 " +
        hours +
        " 小時 " +
        minutes +
        " 分 " +
        seconds +
        " 秒 ";

      // 如果時間到了，停止更新倒數時間
      if (distance < 0) {
        clearInterval(updateCountDown);
        DisPlay();
        TimerId.innerHTML = "已結束";
      }
    }, 1000);
  });
}

//提款
function withdraw() {
  myContract.methods
    .withdraw()
    .send({ from: address })
    .on("receipt", function (receipt) {
      console.log("Transaction receipt:", receipt);
    })
    .on("error", function (error) {
      console.error("Error occurred while sending transaction:", error);
    });
}


//執行Play
function mint() {
  //顯示執行中
  showMinting();

  var GasFee; //gasPrice * gasLimit

  //驗證solver地址合法
  var addr = document.getElementById("address").value;
  if (web3.utils.isAddress(addr)) {
    console.log("The address is valid.");
  } else {
    alert("solver 地址不合法");
    showConnected();
    return;
  }

  //取得預測使用gas
  const maxGasFee = myContract.methods
    .play(addr)
    .estimateGas({ from: address }, (error, gasLimit) => {
      //異常處理
      if (error) {
        alert("請確認 solver 地址 owner 為你使用的帳戶");
        console.error(error);
        showConnected();
      } else {
        console.log("Transaction max gas fee:", gasLimit);

        //發起交易
        web3.eth
          .getGasPrice()
          .then((gasPrice) => {
            GasFee = gasPrice * gasLimit;
            myContract.methods
              .play(addr)
              .send({
                from: address,
                gasPrice: gasPrice,
                gas: gasLimit,
                value: GasFee,
              })
              .on("transactionHash", (hash) => {
                console.log("Transaction hash:", hash);
              })
              .on("receipt", (receipt) => {
                console.log("Transaction receipt:", receipt);
                showConnected();
              })
              .on("error", (error) => {
                console.error(error);
                showConnected();
              });
          })
          .catch((error) => {
            console.error(error);
            showConnected();
          });
      }
    });
}

//每0.6秒確認當前鏈與帳戶是否改變
function setsetInterval() {
  setInterval(function () {
    var results;
    ethereum.request({ method: "eth_requestAccounts" }).then((result) => {
      results = result[0];
      if (results !== address) {
        //切換地址 重新連線
        console.log(results, address);
        Walletconnect();
      }
    });

    this.web3.eth.net.getId((err, netID) => {
      if (netID != ethid) {
        //切換鏈 重新連線
        console.log("netID", netID);
        console.log(ethid);

        Walletconnect();
      }
    });

    //重新取得鏈上資料
    //getTimeOut();
    getJackpot();
    getHighestScore();
    getWinner();
    getPastEvents();
  }, 600);
}

function Walletconnect() {
  if (window.ethereum) {
    window.web3 = new Web3(window.ethereum);
    window.ethereum.send("eth_requestAccounts");
  } else {
    alert("Please install wallet");
  }

  ethereum
    .request({ method: "eth_requestAccounts" })
    .then((result) => {
      address = result[0];
      var newaddress = address;
      newaddress = newaddress.substr(0, 4) + "..." + newaddress.substr(38, 4);
      account.innerHTML = newaddress;

      this.web3.eth.net.getId((err, netID) => {
        // 確定鏈正確Test Network: 5
        ethid = netID;
        if (netID != 5) {
          showWrongNetwork();
        } else {
          console.log("getTimeOut");
          console.log(getTimeOut());
          if (getTimeOut()) {
            DisPlay();
            console.log("here");
          } else {
            showConnected();
            getTimer();
          }
        }
      });

      if (!timestart) {
        setsetInterval();
        timestart = true;
      }
    })
    .catch((error) => {
      console.log("error", error);
    });

  web3 = new Web3(web3.currentProvider);
  myContract = new web3.eth.Contract(abix, Contractaddress);
}
