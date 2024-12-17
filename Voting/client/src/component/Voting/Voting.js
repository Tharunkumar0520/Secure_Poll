import React, { Component } from "react";
import { Link } from "react-router-dom";

import Navbar from "../Navbar/Navigation";
import NavbarAdmin from "../Navbar/NavigationAdmin";
import NotInit from "../NotInit";

import getWeb3 from "../../getWeb3";
import Election from "../../contracts/Election.json";

import "./Voting.css";

export default class Voting extends Component {
  constructor(props) {
    super(props);
    this.state = {
      ElectionInstance: undefined,
      account: null,
      web3: null,
      isAdmin: false,
      candidateCount: undefined,
      candidates: [],
      isElStarted: false,
      isElEnded: false,
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

      const candidateCount = await this.state.ElectionInstance.methods
        .getTotalCandidate()
        .call();
      this.setState({ candidateCount: candidateCount });

      const start = await this.state.ElectionInstance.methods.getStart().call();
      this.setState({ isElStarted: start });
      const end = await this.state.ElectionInstance.methods.getEnd().call();
      this.setState({ isElEnded: end });

      for (let i = 1; i <= this.state.candidateCount; i++) {
        const candidate = await this.state.ElectionInstance.methods
          .candidateDetails(i - 1)
          .call();
        this.state.candidates.push({
          id: candidate.candidateId,
          header: candidate.header,
          slogan: candidate.slogan,
        });
      }
      this.setState({ candidates: this.state.candidates });

      const voter = await this.state.ElectionInstance.methods
        .voterDetails(this.state.account)
        .call();
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

      const admin = await this.state.ElectionInstance.methods.getAdmin().call();
      if (this.state.account === admin) {
        this.setState({ isAdmin: true });
      }
    } catch (error) {
      alert(`Failed to load web3, accounts, or contract. Check console.`);
      console.error(error);
    }
  };

  renderCandidatesTable = () => {
    const castVote = async (id) => {
      await this.state.ElectionInstance.methods
        .vote(id)
        .send({ from: this.state.account, gas: 1000000 });
      window.location.reload();
    };
    const confirmVote = (id, header) => {
      if (window.confirm(`Vote for ${header} with Id ${id}.\nAre you sure?`)) {
        castVote(id);
      }
    };

    return (
      <table className="voting-table">
        <thead>
          <tr>
            <th>Candidate ID</th>
            <th>Candidate Name</th>
            <th>Party Name</th>
            <th>Vote</th>
          </tr>
        </thead>
        <tbody>
          {this.state.candidates.map((candidate) => (
            <tr key={candidate.id}>
              <td>{candidate.id}</td>
              <td>{candidate.header}</td>
              <td>{candidate.slogan}</td>
              <td>
                <button
                  onClick={() => confirmVote(candidate.id, candidate.header)}
                  className="vote-btn"
                  disabled={
                    !this.state.currentVoter.isRegistered ||
                    !this.state.currentVoter.isVerified ||
                    this.state.currentVoter.hasVoted
                  }
                >
                  Vote
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
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
        <div className="main">
          {!this.state.isElStarted && !this.state.isElEnded ? (
            <NotInit />
          ) : this.state.isElStarted && !this.state.isElEnded ? (
            <>
              {this.state.currentVoter.isRegistered ? (
                this.state.currentVoter.isVerified ? (
                  this.state.currentVoter.hasVoted ? (
                    <div className="container-item success center">
                      <center>You've cast your vote.</center>
                      <Link to="/Results">See Results</Link>
                    </div>
                  ) : (
                    <div className="container-item info center">
                      <center>Go ahead and cast your vote.</center>
                    </div>
                  )
                ) : (
                  <div className="container-item attention center">
                    <center>Please wait for admin verification.</center>
                  </div>
                )
              ) : (
                <div className="container-item attention center">
                  <center>
                    You're not registered.{" "}
                    <Link to="/Registration">Register here</Link>
                  </center>
                </div>
              )}
              <div className="container-main">
                <h2>Candidates</h2>
                <small>Total candidates: {this.state.candidates.length}</small>
                {this.state.candidates.length < 1 ? (
                  <div className="container-item attention center">
                    <center>No candidates available to vote for.</center>
                  </div>
                ) : (
                  this.renderCandidatesTable()
                )}
              </div>
            </>
          ) : (
            <div className="container-item attention center">
              <center>
                <h3>The Election has ended.</h3>{" "}
                <a href="/Results">See Result</a>
              </center>
            </div>
          )}
        </div>
      </>
    );
  }
}
