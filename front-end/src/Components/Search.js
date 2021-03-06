import React, { Component } from 'react';
import NavigationBar from './NavigationBar';
import './styles/HomeContent.css';
import {withRouter} from 'react-router-dom';
import { Card, Button, Alert} from 'react-bootstrap';
import { connect } from 'react-redux';

const StateToProps = (state) => ({ //application level state via redux
    CurrUser: state.user
});

class Search extends Component {

    constructor(props) {
        super(props);
        this.state = {
            users: [],
            seriess: [],
            seriesOwners: [],
            comics: [],
            ratings: [],
            error: "",
            success: ""
        }
    }

    componentWillMount() {
        if(this.props.CurrUser.username === "" || this.props.CurrUser.token === "" || this.props.CurrUser.email === "" || this.props.CurrUser.isValidated === false){
            this.props.history.push('/')
        }
    }

    componentWillReceiveProps(nextProps) {
        // Update search if query changes
        if (this.props.history.location.state) {
            if (nextProps.location.state.query !== this.props.location.state.query) {
                (async () => {
                    const res = await fetch("http://localhost:8080/search", {
                        method: "POST",
                        headers: {
                            Accept: "application/json",
                            "Content-Type": "application/json; charset=utf-8"
                        },
                        body: JSON.stringify({
                            username: this.props.CurrUser.username,
                            token: this.props.CurrUser.token,
                            query: this.props.history.location.state.query
                        })
                    });
                    let content = await res.json();
                    console.log(content)
                    this.setState({comics: content.all_comics, users: content.users, seriess: content.all_series, seriesOwners: content.seriesOwners}, () => {
                        console.log(this.state);
                        if(this.state.comics.length){
                            this.state.comics.forEach(com=> {
                                console.log(com.id)
                                this.getRating(com.id);
                            })
                        }
                    })
                })();
            } else {
                this.props.history.push("/");
            }
        }
    }

    componentDidMount(){
        if (this.props.history.location.state) {
            (async () => {
                const res = await fetch("http://localhost:8080/search", {
                    method: "POST",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json; charset=utf-8"
                    },
                    body: JSON.stringify({
                        username: this.props.CurrUser.username,
                        token: this.props.CurrUser.token,
                        query: this.props.history.location.state.query
                    })
                });
                let content = await res.json();
                console.log(content)
                this.setState({comics: content.all_comics, users: content.users, seriess: content.all_series, seriesOwners: content.seriesOwners}, () => {
                    console.log(this.state);
                    if(this.state.comics.length){
                        this.state.comics.forEach(com=> {
                            console.log(com.id)
                            this.getRating(com.id);
                        })
                    }
                })
            })();   
        } else {
            this.props.history.push("/");
        }
    }

    handleReport = (e, reportedID, reportingID, type) =>{
        if(e.target.name === "admin"){
            this.setState({ error: "You can't report an admin.", success: "" });
        }
        else if(e.target.name === this.props.CurrUser.username){
            this.setState({ error: "You can't report yourself.", success: "" });
        }
        else{
            this.props.history.push({
                pathname: '/report', 
                state: {
                  reportingID: reportingID,
                  reportedID: reportedID,
                  type: type
                }
            });
        }
    }

    handleSeeUserStuff = (name) => {
        console.log(name);
        this.props.history.push({
            pathname: '/dashboard', 
            state: {
              username: name
            }
        })
    }

    handleSubscribe = (e) => {
        e.persist();
        if(e.target.name === this.props.CurrUser.username){
            this.setState({ error: "You can't subscribe to yourself.", success: "" });
        }
        else{
            (async () => {
                const res = await fetch("http://localhost:8080/subscribe", {
                    method: "POST",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json; charset=utf-8"
                    },
                    body: JSON.stringify({
                        username: this.props.CurrUser.token,
                        sub: e.target.name
                    })
                });
                let content = await res.json();
                console.log(content)
                if(content.result === "error") {
                    this.setState({ error: "You're already subscribed to this user.", success: "" });
                } else {
                    this.setState({ success: `You're now subscribed to ${e.target.name}.`, error: "" });
                }
            })(); 
        }
    }

    handleUnSubscribe = (e) => {
        e.persist();
        if(e.target.name === this.props.CurrUser.username){
            this.setState({ error: "You can't unsubscribe from yourself since you can't subscribe to yourself.", success: "" });
        }
        else{
            (async () => {
                const res = await fetch("http://localhost:8080/unsubscribe", {
                    method: "POST",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json; charset=utf-8"
                    },
                    body: JSON.stringify({
                        username: this.props.CurrUser.token,
                        unSub: e.target.name
                    })
                });
                let content = await res.json();
                console.log(content)
                if(content.result === "error") {
                    this.setState({ error: "You're not subscribed to this user.", success: "" });
                } else {
                    this.setState({ success: `You're now unsubscribed from ${e.target.name}.`, error: "" });
                }
            })(); 
        }
    }

    handleViewSeries = (username, seriesName) => {
        this.props.history.push(`/view/series/${username}/${seriesName}`);
    }

    handleViewComic = (comic) => {
        this.props.history.push(`/view/comic/${comic.username}/${comic.comicSeriesName}/${comic.comicName}`);
    }

    getRating = (id) => {
        (async () => {
            const res = await fetch("http://localhost:8080/comic/rate/getRating", {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json; charset=utf-8"
                },
                body: JSON.stringify({
                    comicID: id
                })
            });
            let content = await res.json();
            console.log(content)
            this.setState({ratings: [...this.state.ratings, content.result]})
        })();
    }

    render() {
        /*variant="primary"*/
        console.log(this.state.ratings);
        const matchedUsers = this.state.users.length ? this.state.users.map(usr => {
            return (
                usr ?
                <Card key={usr.username} className="search-card">
                    <Card.Body>
                        <Card.Title className="search-user-card-title" onClick={() => {this.handleSeeUserStuff(usr.username)}}>User: {usr.username} (click here to see more details)</Card.Title>
                        <Card.Text>Total Series: {usr.comicSeries.length}</Card.Text>
                        <Card.Text>Total Comics: {usr.comics.length}</Card.Text>
                        <div style={{ display: "flex", justifyContent: "space-between"}}>
                            <Button name={usr.username} onClick={this.handleSubscribe} variant="primary">Subscribe</Button>
                            <Button name={usr.username} onClick={this.handleUnSubscribe} variant="primary">Unsubscribe</Button>
                            <Button name={usr.username} onClick={(e) => {this.handleReport(e, usr.id, this.props.CurrUser.id, "user")}} variant="danger">Report User</Button>
                        </div>
                    </Card.Body>
                </Card>
                : null
            )
        }) : <h3 > No Users Found With Search Keywords.</h3>
        const matchedSeries = this.state.seriess.length ? this.state.seriess.map((ser, i) => {
            return (
                ser ?
                <Card key={i} className="search-card">
                    <Card.Body>
                        <Card.Title className="search-user-card-title" onClick={() => {this.handleViewSeries(this.state.seriesOwners[i], ser.name )}}>Series Name: {ser.name} (click here to see more details)</Card.Title>
                        <Card.Text>Artist: {this.state.seriesOwners[i]}</Card.Text>
                        <Button name={ser.username} onClick={(e) => {this.handleReport(e, ser.id, this.props.CurrUser.id, "series")}} variant="danger">Report Series</Button>
                    </Card.Body>
                </Card>
                : null
            )
        }) : <h3 > No Series Found With Search Keywords.</h3>
        const matchedComics = this.state.comics.length ? this.state.comics.map((com, i)=> {
            return (
                com ?
                <Card key={com.comicID} className="search-card">
                    <Card.Body>
                        <Card.Title className="search-user-card-title" onClick={() => {this.handleViewComic(com)}}>Comic Name: {com.comicName} (click here to see more details)</Card.Title>
                        <Card.Text>Artist: {com.username}</Card.Text>
                        <Card.Text>Rating: {this.state.ratings[i]}</Card.Text>
                        <Button name={com.name} onClick={(e) => {this.handleReport(e, com.comicID, this.props.CurrUser.id, "comic")}} variant="danger">Report Comic</Button>
                    </Card.Body>
                </Card>
                : null
            )
        }) : <h3 > No Comics Found With Search Keywords.</h3>
        return (
            <div className="home-main-container">
                <NavigationBar history={this.props.history}/>
                <Card className = "search-card">
                {this.state.success ? <Alert variant="success" className="search-alert">{this.state.success}</Alert> : this.state.error ? <Alert variant="danger" className="search-alert">{this.state.error}</Alert> : <Alert variant="danger" className="search-alert" style={{ visibility: "hidden" }}>Hi</Alert>}
                <div className="search-results-container"> {/*add this to css */}
                    {matchedUsers}
                    <hr/>
                    {matchedSeries}
                    <hr/>
                    {matchedComics}
                </div>
                </Card>
            </div>
        );
    }
}

export default connect(StateToProps, {})(withRouter(Search));