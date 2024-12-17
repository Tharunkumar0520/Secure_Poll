import React, { useState } from 'react';
import { useHistory,Link } from 'react-router-dom';
import axios from 'axios';
import './NewRegStyle.css';

function Signup() {
  const [userData, setUserData] = useState({});
  const [confirmPassword, setConfirmPassword] = useState('');
  const history = useHistory();

  const handleInputChange = (e) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (confirmPassword !== userData.newPassword) {
      alert('Passwords do not match');
      return;
    }
    axios.post('http://127.0.0.1:5001/register', userData)
      .then((response) => {
        alert(response.data.message);
        setUserData({});
        setConfirmPassword('');
        history.push('/');
      })
      .catch((error) => {
        console.error(error);
        alert('Error registering user');
      });
  };

  const handleLoginRedirect = () => {
    history.push('/');
  };

  return (
    <div className="signup-container">
      <h1 id="signup"><strong>SignUp</strong></h1>
      <form onSubmit={handleFormSubmit}>
        <label>
          Official Email:
          <input type="email" name="officialEmail" onChange={handleInputChange} />
        </label>
        <label>
          Aadhar Number:
          <input type="text" name="studentID" onChange={handleInputChange} />
        </label>
        <label>
          Name:
          <input type="text" name="name" onChange={handleInputChange} />
        </label>
        <label>
          Age:
          <input type="text" name="course" onChange={handleInputChange} />
        </label>
        <label>
          Voter ID:
          <input type="text" name="universityRollno" onChange={handleInputChange} />
        </label>
        <label>
          New Password:
          <input type="password" name="newPassword" onChange={handleInputChange} />
        </label>
        <label>
          Confirm new Password:
          <input
            type="password"
            name="confirmPassword"
            value={confirmPassword}
            onChange={handleConfirmPasswordChange}
          />
        </label>
        <button type="submit">Register</button>
      </form>
      <p>
        Already registered?{" "}
        <a href='/' style={{color:'#000000'}}>Login</a>
      </p>
    </div>
  );
}

export default Signup;