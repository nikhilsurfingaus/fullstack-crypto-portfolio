import { useState, useEffect } from 'react';
import './Main.css';
import LoginDisp from './LoginDisp';
import { auth, db } from './BaseFire';
import { collection, getDocs, updateDoc, doc } from "firebase/firestore"; 
import { ListGroup, ListGroupItem } from 'reactstrap';
import Modal from 'react-modal';

const Main = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const [coins, setCoins] = useState<{[key: string]: number}>({});
  const [selectedCoin, setSelectedCoin] = useState<string>("");
  const [coinAmount, setCoinAmount] = useState<string>("");

  const [showTrans, setShowTrans] = useState<boolean>(false)

  useEffect(() => {
    const email = localStorage.getItem('email');
    if (email) {
      setUserEmail(email);
      setIsLoggedIn(true);

      const fetchData = async () => {
        const querySnapshot = await getDocs(collection(db, "users"));
        querySnapshot.forEach((doc) => {
          if (doc.id === email) {
            setCoins(doc.data().Coins || {});
          }
        });
      };

      fetchData();
    }
  }, []);

  const signOut = () => {
    auth.signOut().then(() => {
      setIsLoggedIn(false);
      setUserEmail('');
      setCoins({});
      localStorage.removeItem('email');
    });
  };

  const handleCoinSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCoin(event.target.value);
  };

  const handleCoinAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCoinAmount(event.target.value);
  };

  const handleAddCoin = async () => {
    if (selectedCoin && coinAmount) {
      if (selectedCoin in coins) {
        alert("Coin already exists in your portfolio!");
        setCoinAmount("")
        setSelectedCoin("")
        return;
      }

      const newCoins = {...coins};
      newCoins[selectedCoin] = Number(coinAmount);

      await updateDoc(doc(db, "users", userEmail), {
        Coins: newCoins
      });

      setCoins(newCoins);
      setSelectedCoin("");
      setCoinAmount("");
    }
  };

  const [transferCoin, setTransferCoin] = useState('')
  const [transAmount, setTransAmount] = useState<number>(0)
  const [openModal, setOpenModal] = useState<boolean>(false)
  const [isNeg, setIsNeg] = useState<boolean>(false)
  const [transText, setTransText] = useState<string>("Amount In")

  function initTransfer(coin: string, negTrans?:boolean) {
    if (negTrans) {
      setIsNeg(true)
      setTransText("Amount Out")
    }
    setTransferCoin(coin)
    setShowTrans(true)
    hideModal(false)
    setOpenModal(true)
  }

  const transaction = async(coin: string, amount:number) => {
    console.log("Transfered: ", amount, " into ", coin)
    setShowTrans(false)
  // Check if coin exists in user's portfolio
  if (!(coin in coins)) {
    alert("Coin does not exist in your portfolio!");
    return;
  }

  // Calculate new coin amount after transaction
  if (isNeg) {
    amount = -amount
  } 
  const newCoinAmount = coins[coin] + amount;

  // Update Firestore document with new coin amount
  const docRef = doc(db, "users", userEmail);
  await updateDoc(docRef, {
    [`Coins.${coin}`]: newCoinAmount,
  });

  // Update local state with new coin amount
  const newCoins = { ...coins, [coin]: newCoinAmount };
  setCoins(newCoins);
  hideModal(false)
  setTransferCoin('')
  setTransAmount(0)
  setIsNeg(false)
  setTransText("Amount In")
 }

 function hideModal(state:boolean) {
  setOpenModal(state)
 }

 function handleClose() {
  setOpenModal(false)
  setTransferCoin('')
  setTransAmount(0)
  setIsNeg(false)
  setTransText("Amount In")
 }

    return (
        <div className="wrapper mt-5">
          <h2>My Portfolio</h2>
          {isLoggedIn ? (
            <div>
              <button className="btn btn-danger sign-out-btn" onClick={signOut}>Sign out</button>
              <h2>YOU ARE LOGGED IN as {userEmail}</h2>
              <h3>Add Coin</h3>
              <div className="row mb-3">
                <div className="col-md-4 offset-md-4">
                    <div className="input-group">
                    <select className="form-select" value={selectedCoin} onChange={handleCoinSelect}>
                        <option value="">Select a coin</option>
                        <option value="BTC">BTC</option>
                        <option value="ETH">ETH</option>
                        <option value="BNB">BNB</option>
                        <option value="XRP">XRP</option>
                    </select>
                    {selectedCoin && (
                        <input type="number" className="form-control" placeholder="Enter amount" value={coinAmount} onChange={handleCoinAmountChange} />
                    )}
                    <button className="btn btn-primary" onClick={handleAddCoin}>Add Coin</button>
                    </div>
                </div>
                </div>
              <h3>Existing Coins</h3>
              <ListGroup className="coin-list mx-auto">
                {Object.entries(coins).map(([coin, amount]) => (
                    <ListGroupItem key={coin} className="d-flex justify-content-between align-items-center">
                    <div className="coin-info d-flex align-items-center">
                        <span>{coin}</span>
                    </div>
                    <div className="d-flex align-items-center">
                        <button onClick={() => initTransfer(coin)} className="btn btn-sm btn-success mr-1">+</button>
                        <button onClick={() => initTransfer(coin, true)} className="btn btn-sm btn-danger">-</button>
                        <span className="mr-2">{amount}</span>
                    </div>
                    </ListGroupItem>
                ))}
                </ListGroup>
                {showTrans ? (
                  <div>
                    <Modal isOpen={openModal} className="modal-container">
                      <button className="modal-close-btn" onClick={() => handleClose()}>X</button>
                      <div className="modal-header">{transferCoin} Transaction</div>
                      <label className='fw-bold'>{transText}</label>
                      <input type="number" className="modal-input" placeholder="Enter amount" value={transAmount} onChange={(e) => setTransAmount(parseFloat(e.target.value))} />
                      <button className="modal-button" onClick={() => transaction(transferCoin, transAmount)}>Transfer</button>
                    </Modal>
                  </div>
                  ) : null}
            </div>
          ) : (
            <div>
              <LoginDisp isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} setUserEmail={setUserEmail} />
            </div>
          )}
        </div>
      );
      
};

export default Main;
