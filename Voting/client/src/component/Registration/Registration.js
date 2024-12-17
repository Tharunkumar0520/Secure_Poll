import React, { Component } from "react";

import Navbar from "../Navbar/Navigation";
import NavbarAdmin from "../Navbar/NavigationAdmin";
import NotInit from "../NotInit";

import "./Registration.css";

import getWeb3 from "../../getWeb3";
import Election from "../../contracts/Election.json";

export default class Registration extends Component {
  constructor(props) {
    super(props);
    this.state = {
      ElectionInstance: undefined,
      web3: null,
      account: null,
      isAdmin: false,
      isElStarted: false,
      isElEnded: false,
      voterCount: undefined,
      voterName: "",
      voterPhone: "",
      voters: [],
      currentVoter: {
        address: undefined,
        name: null,
        phone: null,
        hasVoted: false,
        isVerified: false,
        isRegistered: false,
      },
    };
  }

  componentDidMount = async () => {
    if (!window.location.hash) {
      window.location = window.location + "#loaded";
      window.location.reload();
    }
    try {
      const web3 = await getWeb3();
      const accounts = await web3.eth.getAccounts();
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = Election.networks[networkId];
      const instance = new web3.eth.Contract(
        Election.abi,
        deployedNetwork && deployedNetwork.address
      );

      this.setState({
        web3: web3,
        ElectionInstance: instance,
        account: accounts[0],
      });

      const admin = await this.state.ElectionInstance.methods.getAdmin().call();
      if (this.state.account === admin) {
        this.setState({ isAdmin: true });
      }

      const start = await this.state.ElectionInstance.methods.getStart().call();
      this.setState({ isElStarted: start });
      const end = await this.state.ElectionInstance.methods.getEnd().call();
      this.setState({ isElEnded: end });

      const voterCount = await this.state.ElectionInstance.methods.getTotalVoter().call();
      this.setState({ voterCount: voterCount });

      const votersList = [];
      for (let i = 0; i < this.state.voterCount; i++) {
        const voterAddress = await this.state.ElectionInstance.methods.voters(i).call();
        const voter = await this.state.ElectionInstance.methods.voterDetails(voterAddress).call();
        votersList.push({
          address: voter.voterAddress,
          name: voter.name,
          phone: voter.phone,
          hasVoted: voter.hasVoted,
          isVerified: voter.isVerified,
          isRegistered: voter.isRegistered,
        });
      }
      this.setState({ voters: votersList });

      const voter = await this.state.ElectionInstance.methods.voterDetails(this.state.account).call();
      this.setState({
        currentVoter: {
          address: voter.voterAddress,
          name: voter.name,
          phone: voter.phone,
          hasVoted: voter.hasVoted,
          isVerified: voter.isVerified,
          isRegistered: voter.isRegistered,
        },
      });
    } catch (error) {
      console.error(error);
      alert(`Failed to load web3, accounts, or contract. Check console for details (f12).`);
    }
  };

  updateVoterName = (event) => {
    this.setState({ voterName: event.target.value });
  };

  updateVoterPhone = (event) => {
    this.setState({ voterPhone: event.target.value });
  };

  registerAsVoter = async () => {
    await this.state.ElectionInstance.methods
      .registerAsVoter(this.state.voterName, this.state.voterPhone)
      .send({ from: this.state.account, gas: 1000000 });
    window.location.reload();
  };

  render() {
    if (!this.state.web3) {
      return (
        <>
          {this.state.isAdmin ? <NavbarAdmin /> : <Navbar />}
          <center>Loading Web3, accounts, and contract...</center>
        </>
      );
    }

    return (
      <>
        {this.state.isAdmin ? <NavbarAdmin /> : <Navbar />}
        {!this.state.isElStarted && !this.state.isElEnded ? (
          <NotInit />
        ) : (
          <>
            <div className="container-main">
              <h3>Registration</h3>
              <small>Register to vote.</small>
              <div className="container-item">
                <form>
                  <div className="div-li">
                    <label className={"label-r"}>
                      Account Address
                      <input
                        className={"input-r"}
                        type="text"
                        value={this.state.account}
                        style={{ width: "400px" }}
                      />
                    </label>
                  </div>
                  <div className="div-li">
                    <label className={"label-r"}>
                      Voter Name
                      <input
                        className={"input-r"}
                        type="text"
                        placeholder="Name"
                        value={this.state.voterName}
                        onChange={this.updateVoterName}
                      />
                    </label>
                  </div>
                  <div className="div-li">
                    <label className={"label-r"}>
                      Aadhar Number <span style={{ color: "tomato" }}>*</span>
                      <input
                        className={"input-r"}
                        type="number"
                        placeholder="XXXX XXXX XXXX"
                        value={this.state.voterPhone}
                        onChange={this.updateVoterPhone}
                      />
                    </label>
                  </div>
                  <div className="button-container">
                    <button
                      className="btn-add"
                      disabled={
                        this.state.voterPhone.length !== 12 || this.state.currentVoter.isVerified
                      }
                      onClick={this.registerAsVoter}
                    >
                      {this.state.currentVoter.isRegistered ? "Update" : "Register"}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <div
              className="container-main"
              style={{
                borderTop: this.state.currentVoter.isRegistered ? null : "1px solid",
              }}
            >
              {loadCurrentVoter(this.state.currentVoter, this.state.currentVoter.isRegistered)}
            </div>

            {this.state.isAdmin && (
              <div className="container-main" style={{ borderTop: "1px solid" }}>
                <small>Total Voters: {this.state.voters.length}</small>
                {loadAllVoters(this.state.voters)}
              </div>
            )}
          </>
        )}
      </>
    );
  }
}

export function loadCurrentVoter(voter, isRegistered) {
  return (
    <>
      <div
        className={"container-item " + (isRegistered ? "success" : "attention")}
      >
        <center>Your Registered Info</center>
      </div>
      <div
        className={"container-list " + (isRegistered ? "success" : "attention")}
      >
        <table>
          <tr>
            <th>Account Address</th>
            <td>{voter.address}</td>
          </tr>
          <tr>
            <th>Voter Name</th>
            <td>{voter.name}</td>
          </tr>
          <tr>
            <th>Aadhar Number</th>
            <td>{voter.phone}</td>
          </tr>
          <tr>
            <th>Voted</th>
            <td>{voter.hasVoted ? "YES" : "NO"}</td>
          </tr>
          <tr>
            <th>Verification</th>
            <td>{voter.isVerified ? "YES" : "NO"}</td>
          </tr>
          <tr>
            <th>Registered</th>
            <td>{voter.isRegistered ? "YES" : "NO"}</td>
          </tr>
        </table>
      </div>
    </>
  );
}

export function loadAllVoters(voters) {
  const renderAllVoters = (voter) => {
    return (
      <>
        <div className="container-list success">
          <table>
            <tr>
              <th>Account address</th>
              <td>{voter.address}</td>
            </tr>
            <tr>
              <th>Voter Name</th>
              <td>{voter.name}</td>
            </tr>
            <tr>
              <th>Aadhar Number</th>
              <td>{voter.phone}</td>
            </tr>
            <tr>
              <th>Voted</th>
              <td>{voter.hasVoted ? "YES" : "NO"}</td>
            </tr>
            <tr>
              <th>Verified</th>
              <td>{voter.isVerified ? "YES" : "NO"}</td>
            </tr>
            <tr>
              <th>Registered</th>
              <td>{voter.isRegistered ? "YES" : "NO"}</td>
            </tr>
          </table>
        </div>
      </>
    );
  };
  return (
    <>
      <div className="container-item success">
        <center>List of voters</center>
      </div>
      {voters.map(renderAllVoters)}
    </>
  );
}
