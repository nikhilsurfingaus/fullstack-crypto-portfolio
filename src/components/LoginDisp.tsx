import { useState, useEffect } from 'react';
import { auth, provider } from './BaseFire';
import { signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import {AiOutlineGooglePlus} from 'react-icons/ai'
import './Login.css'


type LoginToContinueProps = {
  isLoggedIn: boolean;
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  setUserEmail: React.Dispatch<React.SetStateAction<string>>;
};

const LoginDisp = ({ isLoggedIn, setIsLoggedIn, setUserEmail }: LoginToContinueProps) => {
  const [value, setValue] = useState<string>('');

  const SignIn = () => {
    signInWithPopup(auth, provider).then((data) => {
      setValue(data.user.email ?? '');
      localStorage.setItem('email', data.user.email ?? '');
      setIsLoggedIn(true);
      setUserEmail(data.user.email ?? '')
    }).catch(() => {
      setIsLoggedIn(false);
    });
  };

  useEffect(() => {
    setValue(localStorage.getItem('email') ?? '');
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(user ? true : false);
    });
    return () => unsubscribe();
  }, [setIsLoggedIn]);

  return (
    <div className='login' >
      <h3>Login To View Portfolio</h3>
      <button className='btn btn-primary' onClick={SignIn}>Login <AiOutlineGooglePlus style={{fontSize: "1.2rem"}} /> </button>
      <p>{value}</p>
    </div>
  );
};

export default LoginDisp;
