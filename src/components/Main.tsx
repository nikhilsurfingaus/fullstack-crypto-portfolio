import { useState, useEffect } from 'react';
import './Main.css';
import LoginDisp from './LoginDisp';
import { auth, db } from './BaseFire';
import { collection, getDocs, updateDoc, doc, deleteField  } from "firebase/firestore"; 
import { ListGroup, ListGroupItem } from 'reactstrap';
import Modal from 'react-modal';
import {BsTrash} from 'react-icons/bs'
import Select from "react-select";

type loaded = {
  label: string;
  value: string;
  src: string;
  rank: number;
};

const Main = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const [coins, setCoins] = useState<{[key: string]: number}>({});
  const [selectedCoin, setSelectedCoin] = useState<string>("");
  const [coinAmount, setCoinAmount] = useState<string>("");

  const [showTrans, setShowTrans] = useState<boolean>(false)

  //Used for Select
  const [loadedCoins, setLoadedCoins] = useState<loaded[] | null>(null);

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

        const options = {
          method: "GET",
          headers: {
            "X-RapidAPI-Key":
              "51427f28b5mshfbd0334a294cd80p16ef0fjsn7d95525de3a3",
            "X-RapidAPI-Host": "coinranking1.p.rapidapi.com"
          }
        };
  
        fetch(
          "https://coinranking1.p.rapidapi.com/coins?referenceCurrencyUuid=yhjMzLPhuIDl&timePeriod=24h&tiers%5B0%5D=1&orderBy=marketCap&orderDirection=desc&limit=600&offset=0",
          options
        )
          .then((res) => res.json())
          .then((res) => {
            const coins = res.data.coins;
            for (let i = 0; i < coins.length; i++) {
              const coinName = coins[i].symbol;
              // Check if coin name already exists in loadedCoins
              if (loadedCoins?.some((coin) => coin.value === coinName)) {
                continue;
              }
  
              const newCoin: loaded = {
                label: coins[i].name,
                value: coins[i].symbol,
                src: coins[i].iconUrl,
                rank: coins[i].rank
              };
              setLoadedCoins((prevCoins) =>
                prevCoins ? [...prevCoins, newCoin] : [newCoin]
              );
            }})
      };

      fetchData();
    }
       // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  //Drop Down Selector
  const [selectCoin, setSelectCoin] = useState(null);

  const handleChange = (selectedOption: any) => {
    setSelectCoin(selectedOption.value);
    setSelectedCoin(selectedOption.value.toString())
  };

  const signOut = () => {
    auth.signOut().then(() => {
      setIsLoggedIn(false);
      setUserEmail('');
      setCoins({});
      localStorage.removeItem('email');
    });
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

  let newCoinAmount = coins[coin] + amount;

  if (newCoinAmount < 0) {
    newCoinAmount = 0
  }

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

 const [openTrash, setOpenTrash] = useState<boolean>(false)
 const [deleteCoin, setDeleteCoin] = useState<string>('')

 function delCoin(trashModal:boolean, coin:string) {
  setOpenTrash(trashModal)
  setDeleteCoin(coin)
 }

 function closeSure() {
  setOpenTrash(false)
  setDeleteCoin('')
 }

 const handleSure = async() => {
      //Make Function Asynch
      //Handle removing field from Coins in DB and Local here that macth the deleteCoin state
      if (!(deleteCoin in coins)) {
        setOpenTrash(false)
        return;
      }
      // Delete field from Firestore document
      const docRef = doc(db, "users", userEmail);
      await updateDoc(docRef, {
        [`Coins.${deleteCoin}`]: deleteField(),
      });
  
      // Update local state with deleted field
      const { [deleteCoin]: _, ...newCoins } = coins;
      setCoins(newCoins);
      setDeleteCoin("");
      setOpenTrash(false)
  }

    return (
        <div className="wrapper mt-5">
          <h2 className='mb-5' >MoonCoinCollector</h2>
          {isLoggedIn ? (
            <div>
              <button className="btn btn-danger sign-out-btn" onClick={signOut}>Sign out</button>
              <h2 className='user-email'>{userEmail}</h2>
              <div className="row mb-5">
                <div className="col-md-4 offset-md-4">
                    <div className="input-group">
                    {loadedCoins ? (
                      <Select placeholder="Search Coin..." className='react-select text-black' options={loadedCoins} onChange={handleChange} />
                    ): (<p>Loading...</p>)}
                    {selectCoin && (
                        <input type="number" className="form-control" placeholder="Enter amount" value={coinAmount} onChange={handleCoinAmountChange} />
                    )}
                    <button className="btn btn-primary" onClick={handleAddCoin}>Add Coin</button>
                    </div>
                </div>
                </div>
              <h3 className='mb-3' >My Portfolio Coins</h3>
              <ListGroup className="coin-list mx-auto">
                {Object.entries(coins).map(([coin, amount]) => (
                  <ListGroupItem key={coin} className="d-flex justify-content-between align-items-center">
                    <div className="coin-info d-flex align-items-center">
                    <span className='rank' >#{loadedCoins?.find(c => c.value === coin)?.rank}</span>
                    <img src={loadedCoins?.find(c => c.value === coin)?.src} alt={`${coin} icon`} className="coin-icon mr-2" />
                      <span>{coin}</span>
                    </div>
                    <div className="d-flex align-items-end">
                      <div className="transact d-flex align-items-end">
                        <button onClick={() => initTransfer(coin)} className="btn btn-sm btn-success mr-1">+</button>
                        <button onClick={() => initTransfer(coin, true)} className="btn btn-sm btn-danger">-</button>
                      </div>
                      <span className="mr-2">{amount}</span>
                      <span className="mr-2 trash"> <BsTrash onClick={() => delCoin(true, coin)} /> </span>
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
                      <button className="modal-button mb-2" onClick={() => transaction(transferCoin, transAmount)}>Transfer</button>
                    </Modal>
                  </div>
                  ) : null}

                    <Modal isOpen={openTrash} className="modal-container" ariaHideApp={false}>
                      <button className="modal-close-btn" onClick={() => closeSure()}>X</button>
                      <p>Remove {deleteCoin} From Portfolio?</p>
                      <button className="modal-button mb-2" onClick={() => handleSure() } >Remove {deleteCoin}</button>
                    </Modal>



            </div>
          ) : (
            <div>
              <LoginDisp isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} setUserEmail={setUserEmail} />
            </div>
          )}
          <div className='footer'>Copyright 2023 Nikhil Naik | @WaveFlightSimulation All Rights Reserved </div>
        </div>
      );
      
};

export default Main;
