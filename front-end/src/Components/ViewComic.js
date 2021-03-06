import React, { Component } from 'react';
import {withRouter} from 'react-router-dom'
import { connect } from 'react-redux'
import PropTypes from 'prop-types';
import { Badge, Button, Card, Form, Overlay, Tooltip } from 'react-bootstrap';
import  { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import JSZip from 'jszip';

import NavigationBar from './NavigationBar';
import './styles/ViewComic.css';
import { viewComic } from './../Actions/NavbarActions';
import { clearPanels, saveNewComic } from './../Actions/ComicActions';

const StateToProps = (state) => ({ //application level state via redux
    CurrUser: state.user,
    comic: state.comic
});
class ViewComic extends Component {
    constructor(props){
        super(props);
        this.upvoteRef = React.createRef();

        this.state = {
            comicData: {},
            panelIndex: 0,
            subbed: false,
            rating: 0,
            didDownVote: false,
            didUpVote: false,
            comment: '',
            comments: [],
            upvoteError: ""
        }
    }

    componentDidMount() {
        if(this.props.CurrUser.username === "" || this.props.CurrUser.token === "" || this.props.CurrUser.email === "" || this.props.CurrUser.isValidated === false){
            this.props.history.push('/')
        } else {
            console.log('COMIC', this.props.comic);
            if (!this.props.match.params.username || !this.props.match.params.comicName) {
                this.props.history.goBack();
            }
            this.props.viewComic(this.props.match.params.username, this.props.CurrUser.username, this.props.match.params.comicName, this.props.match.params.seriesName, this.props.CurrUser.token);
            // Check if subbed
            (async () => {
                const res = await fetch("http://localhost:8080/isSubbed", {
                    method: "POST",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json; charset=utf-8"
                    },
                    body: JSON.stringify({
                        token: this.props.CurrUser.token,
                        username: this.props.match.params.username
                    })
                });
                let content = await res.json();
                console.log(content)
                this.setState({ subbed: content.result })
            })();
        }
    }

    componentWillReceiveProps(nextProps){
        console.log("COMPONENT RECEIVING PROPS");
        // Reload for suggestions
        if (this.props.location.pathname !== nextProps.location.pathname) {
            console.log("CLICKED ON SUGGESTED COMIC");
            this.props.viewComic(nextProps.match.params.username, nextProps.CurrUser.username, nextProps.match.params.comicName, nextProps.match.params.seriesName, nextProps.CurrUser.token);
        } else {
        // Set the new comments
        if (nextProps.comic.saveNewComic.commentsList) {
            this.setState({ comments: nextProps.comic.saveNewComic.commentsList });
        }
        if((nextProps.comic.saveNewComic.privacy === "Private" && this.props.CurrUser.username !== this.props.match.params.username) && nextProps.comic.saveNewComic.sharedWith.indexOf(this.props.CurrUser.username) === -1){
        console.log("NSDGDSG");
            this.props.history.push('/*');
        }
        (async () => {
            const res = await fetch("http://localhost:8080/comic/rate/getRating", {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json; charset=utf-8"
                },
                body: JSON.stringify({
                    comicID: nextProps.comic.saveNewComic.comicID
                })
            });
            let content = await res.json();
            console.log(content)
            this.setState({rating: content.result})
        })(); }
    }

    updateRating(){
        (async () => {
            const res = await fetch("http://localhost:8080/comic/rate/getRating", {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json; charset=utf-8"
                },
                body: JSON.stringify({
                    comicID: this.props.comic.saveNewComic.comicID
                })
            });
            let content = await res.json();
            console.log(content)
            this.setState({rating: content.result})
        })();
    }

    componentWillUnmount() {
        // Clears panels and comic data (if it was loaded after creation)
        console.log("CALLING COMPONENT WILL UNMOUNT VIEW COMIC");
        this.props.clearPanels();
        this.props.saveNewComic({});
    }

    handleLeft = (event) => {
        if (this.state.panelIndex > 0) {
            this.setState({ panelIndex: this.state.panelIndex - 1 });
        }
    }

    handleRight = (event) => {
        if (this.props.comic.saveNewComic.panels && this.state.panelIndex + 1 < this.props.comic.saveNewComic.panels.length) {
            this.setState({ panelIndex: this.state.panelIndex + 1 });
        } else if (this.props.comic.newComic.length && this.state.panelIndex + 1 < this.props.comic.newComic.length) {
            this.setState({ panelIndex: this.state.panelIndex + 1 });
        }
    }

    handleDownload = (event) => {
        console.log("DOWNLOADING");
        const panels = this.props.comic.newComic.length ? this.props.comic.newComic : this.props.comic.saveNewComic.panels ? this.props.comic.saveNewComic.panels : [];
        if (panels.length) {
            const zip =new JSZip();
            for (var i = 0; i < panels.length; i++) {
                // Look for the type of file
                const image = panels[i].image;
                const beginning = image.indexOf('/');
                const end = image.indexOf(';');
                const type = image.substring(beginning + 1, end);
                const base64String = image.replace("data:image/png;base64,", "");
                zip.file(`image${i+1}.${type}`, base64String, { base64: true });

                const jsonFile = panels[i].json; //getting json too
                const data = JSON.stringify(jsonFile, null, "\t"); //attempting to make it look nice lmao
                zip.file(`json${i+1}.json`, data, { base64: false });
            }
            const link = document.createElement('a');
            link.download = `${this.props.match.params.comicName}`;
            zip.generateAsync({type: "base64"}).then((base64) => {
                // window.location = "data:application/zip;base64," + base64;
                link.href = "data:application/zip;base64," + base64;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            })
        }
    }

    handleSubscribe = (event) => {
        if(this.props.CurrUser.username === this.props.match.params.username){
            alert("Can't sub to yourself...")
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
                        sub: this.props.match.params.username
                    })
                });
                let content = await res.json();
                console.log(content)
                this.setState({ subbed: !this.state.subbed });
            })(); 
        }
    }

    handleUpVote = () => {
        if(this.props.match.params.username === this.props.CurrUser.username){
            this.setState({ upvoteError: "You can't upvote your own comic." });
        }
        else if (this.state.didUpVote) {
            this.setState({ upvoteError: "You've already upvoted." });
        }
        else{
            (async () => {
                const res = await fetch("http://localhost:8080/comic/rate", {
                    method: "POST",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json; charset=utf-8"
                    },
                    body: JSON.stringify({
                        username: this.props.CurrUser.username,
                        token: this.props.CurrUser.token,
                        comicID: this.props.comic.saveNewComic.comicID,
                        rating: 1
                    })
                });
                let content = await res.json();
                console.log(content)
                if(content.result !== "success") {
                    this.setState({ upvoteError: "You've already upvoted." });
                } else {
                    this.setState({ upvoteError: "Successfully upvoted." });
                }
                this.setState({didUpVote: !this.state.didUpVote, didDownVote: false})
                this.updateRating();
            })();
        }
    }

    handleDownVote = () => {
        if(this.props.match.params.username === this.props.CurrUser.username){
            this.setState({ upvoteError: "You can't downvote your own comic." });
        }
        else if(this.state.didDownVote) {
            this.setState({ upvoteError: "You've already downvoted." });
        }
        else{
            (async () => {
                const res = await fetch("http://localhost:8080/comic/rate", {
                    method: "POST",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json; charset=utf-8"
                    },
                    body: JSON.stringify({
                        username: this.props.CurrUser.username,
                        token: this.props.CurrUser.token,
                        comicID: this.props.comic.saveNewComic.comicID,
                        rating: -1
                    })
                }); 
                let content = await res.json();
                console.log(content)
                if(content.result !== "success") {
                    this.setState({ upvoteError: "You've already downvoted." });
                } else {
                    this.setState({ upvoteError: "Successfully downvoted" });
                }
                this.setState({didUpVote: false, didDownVote: !this.state.didDownVote})
                this.updateRating();
            })();
        }
    }

    handleClearUpvoteError = () => {
        console.log("CLEARING");
        this.setState({ upvoteError: "" });
    }

    handleComment = (event) => {
        event.preventDefault();
        console.log('COMMENTING');
        // Adds comment on backend, updates comments with this one and fetches the comments again
        this.setState({ comments: [...this.state.comments, { username: this.props.CurrUser.username, content: this.state.comment }] });
        (async () => {
            const res = await fetch("http://localhost:8080/comment", {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json; charset=utf-8"
                },
                body: JSON.stringify({
                    comicOwner: this.props.match.params.username,
                    comicName: this.props.match.params.comicName,
                    seriesName: this.props.match.params.seriesName,
                    commenterName: this.props.CurrUser.token,
                    content: this.state.comment
                })
            });
            let content = await res.json();
            console.log(content);
            if(content.status !== "success") {
                alert('Your comment could not be posted');
                // Remove the comment that was appended in the beginning
                var copy = [...this.state.comments];
                copy.splice(copy.length - 1, 1);
                this.setState({ comments: copy });
            }
            // Reload the comments in case of change
            (async () => {
                const res = await fetch("http://localhost:8080/view/comic", {
                    method: "POST",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json; charset=utf-8"
                    },
                    body: JSON.stringify({
                        comicName: this.props.match.params.comicName,
                        seriesName: this.props.match.params.seriesName,
                        comicOwnerName: this.props.match.params.username,
                        viewerName: this.props.CurrUser.token
                    })
                });
                let content = await res.json();
                console.log(content);
                // Update comments if successful
                if (content.commentsList) {
                    this.setState({ comments: content.commentsList, comment: '' });
                }
            })();
        })();
    }

    handleReportComment = (reportedID, reportingID, type) => {
        this.props.history.push({
            pathname: '/report', 
            state: {
              reportingID: reportingID,
              reportedID: reportedID,
              type: type
            }
        }) 
    }

    renderComments = () => {
        return this.state.comments.map((comment, index) => {
            const deleteButton = comment.username === this.props.CurrUser.username ? 
                <FontAwesomeIcon icon="trash" style={{ position: "absolute", top: "1.25rem", right: "1.25rem" }} onClick={(e) => this.handleDeleteComment(comment, index, e)} /> : null;
            const reportButton = comment.username !== this.props.CurrUser.username ? 
                <Button variant="danger" style={{ position: "absolute", top: "1.25rem", right: "1.25rem" }} onClick={(e) => this.handleReportComment(comment.id, this.props.CurrUser.id, "comment")} >Report Comment</Button> : null;
            return (
                <Card style={{ marginLeft: 0, marginRight: 0 }} key={index}>
                    <Card.Body>
                        <Card.Title>{ comment.username }</Card.Title>
                        <Card.Subtitle className="mb-2 text-muted">{ comment.date }</Card.Subtitle>
                        <pre>{ comment.content }</pre>
                        {deleteButton}
                        {reportButton}
                    </Card.Body>
                </Card>
            );
        });
    }

    handleDeleteComment = (comment, index, event) => {
        event.preventDefault();
        console.log("DELETING COMMENT");
        (async () => {
            const res = await fetch("http://localhost:8080/delete/comment", {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json; charset=utf-8"
                },
                body: JSON.stringify({
                    commentID: comment.id,
                    comicID: comment.comicID
                })
            }); 
            let content = await res.json();
            console.log(content)
            if(content.result !== "success") {
                // Delete from state
                const copy = [...this.state.comments];
                copy.splice(index, 1);
                this.setState({ comments: copy });
            } else {
                alert("Could not delete comment");
            }
        })();

    }

    handleSeries = (event) => {
        const seriesName = this.props.comic.saveNewComic.seriesName ? this.props.comic.saveNewComic.seriesName : null;
        const creatorName = this.props.comic.saveNewComic.creatorName ? this.props.comic.saveNewComic.creatorName : null;
        if (seriesName && creatorName) {
            this.props.history.push(`/view/series/${creatorName}/${seriesName}`);
        }
    }

    handleChange = (event) => {
        event.preventDefault();
        this.setState({ [event.target.name]: event.target.value });
    }

    handleUnSubscribe = () => {
        if(this.props.CurrUser.username === this.props.match.params.username){
            alert("Can't unsub to yourself...")
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
                        unSub: this.props.match.params.username
                    })
                });
                let content = await res.json();
                console.log(content)
                this.setState({ subbed: !this.state.subbed });
            })(); 
        }
    }

    handleViewSuggestion = (suggestion) => {
        this.props.history.push(`/view/comic/${suggestion.username}/${suggestion.comicSeriesName}/${suggestion.comicName}`);
    }

    renderSuggestions() {
        return (this.props.comic.suggestions.length ? 
            this.props.comic.suggestions.map((suggestion, index) => {
                return (
                    <Card className="view-comic-suggestions-card" style={{ marginLeft: 0, marginRight: 0 }} key={"suggestion-" +  suggestion.comicID} onClick={e => this.handleViewSuggestion(suggestion)}>
                        <Card.Img variant="top" src={suggestion.comicList[0].image} />
                        <Card.Body>
                            <Card.Title>{suggestion.comicName}</Card.Title>
                        </Card.Body>
                    </Card>

                )
            })
            : <h5>No Suggestions</h5>
        );
    }

    handleReport = (e) => {
        if(this.props.comic.saveNewComic.creatorName === "admin"){
            this.setState({ error: "You can't report an admin.", success: "" });
        }
        else if(this.props.comic.saveNewComic.creatorName=== this.props.CurrUser.username){
            this.setState({ error: "You can't report yourself.", success: "" });
        }
        else{
            this.props.history.push({
                pathname: '/report', 
                state: {
                  reportingID: this.props.CurrUser.id,
                  reportedID: this.props.comic.saveNewComic.comicID,
                  type: "comic"
                }
            });
        }

    }

    handleSeeUser = () => {
        this.props.history.push({
            pathname: '/dashboard', 
            state: {
              username: this.props.match.params.username
            }
        })
    }

    render() {
        // Check permissions
        if (this.props.comic.saveNewComic.error) {
            this.props.history.push('/');
        }
        const panels = this.props.comic.newComic.length ? this.props.comic.newComic : this.props.comic.saveNewComic.panels ? this.props.comic.saveNewComic.panels : [];
        const subButton = this.props.CurrUser.username !== this.props.match.params.username ? this.state.subbed ? 
        <div className="ml-auto">
            <Button onClick={this.handleUnSubscribe}>Unsubscribe</Button>
        </div> :
        <div className="ml-auto">
            <Button onClick={this.handleSubscribe}>Subscribe To User</Button>
        </div> : null;

        const reportbtn = this.props.CurrUser.username !== this.props.match.params.username ?
        <div className="ml-auto">
            <Button onClick={ () => {this.handleReport()}} variant="danger">Report</Button>
        </div> : null;
        return (
            <div className="view-comic-container">
                <NavigationBar />
                <div className="view-comic-bottom">
                    <div className="view-comic-overlay">
                        <div className="view-comic-left">
                            <div className="view-comic-left-top">
                                <div className="view-comic-navigate">
                                    <FontAwesomeIcon icon="chevron-left" size="2x" onClick={this.handleLeft} />
                                </div>
                                <div className="view-comic-panel-container">
                                    {panels && panels[this.state.panelIndex] ? <div className="view-comic-panel-inner"><img className="view-comic-panel-img" src={panels[this.state.panelIndex].image} alt="can't load"/></div> : null}
                                </div>
                                <div className="view-comic-navigate">
                                    <FontAwesomeIcon icon="chevron-right" size="2x" onClick={this.handleRight} />
                                </div>
                            </div>
                            <div className="view-comic-left-bottom">
                                <Card style={{ marginLeft: 0, marginRight: 0 }}>
                                    <Card.Body>
                                        <div className="view-comic-title-row">
                                            <h1>{this.props.match.params.comicName}</h1>
                                            <div className="view-comic-button-row ml-auto" ref={this.upvoteRef}>
                                                <FontAwesomeIcon icon="download" size="2x" onClick={this.handleDownload} className="view-comic-button" />
                                                {!this.state.didUpVote ? <FontAwesomeIcon className="icon-cog view-comic-press-like view-comic-button" icon={['far', 'thumbs-up']} size="2x" onClick={this.handleUpVote} /> 
                                                    : <FontAwesomeIcon className="icon-cog view-comic-press-like" icon='thumbs-up' size="2x" onClick={this.handleUpVote} />}
                                                {!this.state.didDownVote ? <FontAwesomeIcon className="icon-cog view-comic-press-dislike view-comic-button" icon={['far', 'thumbs-down']} size="2x" onClick={this.handleDownVote} /> 
                                                    : <FontAwesomeIcon className="icon-cog view-comic-press-dislike" icon='thumbs-down' size="2x" onClick={this.handleDownVote} />}
                                                <Overlay target={this.upvoteRef.current} show={this.state.upvoteError.length > 0} placement="left"><Tooltip onClick={this.handleClearUpvoteError}>{this.state.upvoteError}</Tooltip></Overlay>
                                                <Button role="button" variant="dark" className="view-comic-rating-button">
                                                    Rating <Badge pill variant="secondary">{this.state.rating}</Badge>
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="view-comic-second-row">
                                            <div className="mr-auto">
                                                <h2 className="view-comic-series-h2" onClick={this.handleSeeUser}>By: {this.props.match.params.username}</h2>
                                            </div>
                                            <div className="view-comic-second-middle">
                                                <h2 className="view-comic-series-h2" onClick={this.handleSeries}>Series: {this.props.comic.saveNewComic.seriesName ? this.props.comic.saveNewComic.seriesName : null }</h2>
                                            </div>
                                            {subButton}
                                            
                                            
                                        </div>
                                        <div style={{ width: "100%"}}>
                                        {reportbtn}
                                        </div>
                                    </Card.Body>
                                </Card>
                                <Card style={{ marginLeft: 0, marginRight: 0 }}>
                                    <Card.Body>
                                        <h1>Description</h1>
                                        <pre>{this.props.comic.saveNewComic.description ? this.props.comic.saveNewComic.description : null}</pre>
                                    </Card.Body>
                                </Card>
                                <Form className="view-comic-comment-form" onSubmit={this.handleComment}>
                                    <Form.Control required as="textarea" rows="2" className="view-comic-comment-input" name="comment" type="text" placeholder="Comment on this comic..." value={this.state.comment} onChange={this.handleChange} />
                                    <Button type="submit">Submit</Button>
                                </Form>
                                <div className="view-comic-comment-container">
                                    {this.renderComments()}
                                </div>
                            </div>
                        </div>
                        <div className="view-comic-right">
                            <h3>Suggestions</h3>
                            {this.renderSuggestions()}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

ViewComic.propTypes = {
    CurrUser: PropTypes.object,
    comic: PropTypes.object,
    viewComic: PropTypes.func.isRequired,
    clearPanels: PropTypes.func.isRequired,
    saveNewComic: PropTypes.func.isRequired
}

export default connect(StateToProps, {viewComic, clearPanels, saveNewComic })(withRouter(ViewComic));