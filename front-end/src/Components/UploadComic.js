import React, { Component } from 'react';
import { Button, Dropdown, Form, Alert, Overlay, Table, Tooltip } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { DropzoneArea } from 'material-ui-dropzone';
import {withRouter} from 'react-router-dom';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import NavigationBar from './NavigationBar';
import LoadingScreen from './LoadingScreen';
import Footer from './Footer';
import './styles/UploadComic.css';

const StateToProps = (state) => ({ //application level state via redux
    CurrUser: state.user
});

class UploadComic extends Component {

    constructor(props) {
        super(props);
        this.selectFileRef = React.createRef();
        this.state = {
            isLoading: true,
            image: null,
            json: null,
            filename: null,
            fileError: '',
            comicName: '',
            comicDescription: '',
            privacy: 'Public',
            series: '',
            seriesList: [],
            userInput: '',
            sharedUsersList: [],
            showSubmitError: ''
        }
    }

    componentWillMount() {
        if(this.props.CurrUser.username === "" || this.props.CurrUser.token === "" || this.props.CurrUser.email === "" || this.props.CurrUser.isValidated === false){
            this.props.history.push('/');
        }
    }

    componentDidMount() {
        /*
        let div = this.uploadDropRef.current;
        div.addEventListener('dragenter', this.onDragEnter, false);
        div.addEventListener('dragover', this.onDragOver, false);
        div.addEventListener('drop', this.onDrop, false);*/
        (async () => {
            const res = await fetch("http://localhost:8080/view/series", {
              method: "POST",
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json; charset=utf-8"
              },
              body: JSON.stringify({
                token: this.props.CurrUser.token,
                username: this.props.CurrUser.username
              })
            });
            let content = await res.json();
            console.log("GOT ALL SERIES FOR UPLOAD COMIC", content);
            this.setState({ seriesList: content.comicSeries, isLoading: false });
            if (content.comicSeries && content.comicSeries.length === 0) {
                this.setState({ fileError: "Please create a comic series first." });
            }
        })();
    }

    /*
    onDragEnter = (event) => {
        event.stopPropagation();
        event.preventDefault();
    }

    onDragOver = (event) => {
        event.stopPropagation();
        event.preventDefault();
    }

    onDrop = (event) => {
        event.stopPropagation();
        event.preventDefault();

        const file = event.dataTransfer.files[0];
        this.onFileUpload(file);
    }*/

    onFileUpload = (files) => {
        if (files && files.length > 0) {
            console.log("SELECTED UPLOAD FILE INFO", files[0]);
            const reader = new FileReader();
            reader.onload = (() => {
                return (e) => {
                    console.log(e.target.result);
                    this.setState({ image: e.target.result, filename: files[0].name, fileError: '', showSubmitError: '' });
                };
            })();
            reader.readAsDataURL(files[0]);
        } /*else if (file.type === 'application/json') {
            this.setState({ filename: file.name });
            const reader = new FileReader();
            reader.onload = (() => {
                return (e) => {
                    console.log(e);
                    this.setState({ json: JSON.parse(e.target.result) });
                }
            })();
            reader.readAsText(file);
        }*/ else {
            this.setState({ fileError: "Only image files are allowed.", showSubmitError: '' });
        }
    }

    handleDelete = (event) => {
        this.setState({ image: null, json: null, filename: '' });
    }

    handleComicName = (event) => {
        this.setState({ comicName: event.target.value });
    }

    handleComicDescription = (event) => {
        this.setState({ comicDescription: event.target.value });
    }

    handleAddUser = (event) => {
        this.setState({ userInput: event.target.value });
    }

    handleAddUserEnter = (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            console.log('PRESSED ENTER');
            let newUsers = this.state.userInput.split(' ');
            let newUsers2 = newUsers.filter(item => item !== "");
            console.log('USERS TO ADD', newUsers2);
            this.setState({ sharedUsersList: [...this.state.sharedUsersList, ...newUsers2], userInput: '' }); 
        }
    }

    handleDeleteShare = (index, event) => {
        event.preventDefault();
        console.log(index);
        console.log(event.target);
        var copy = [...this.state.sharedUsersList];
        if (index !== -1) {
            copy.splice(index, 1);
            this.setState({ sharedUsersList: copy });
        }
    }

    handlePrivacy = (event) => {
        this.setState({ privacy: event.target.value });
    }

    handleUserSeries = () => {
        return (
            this.state.seriesList.map(item=> {
                return item !== null ?
                <div key={item.name}>
                    <Dropdown.Item name={item.name} onClick={this.handleChangeSeries}>{item.name}</Dropdown.Item>
                </div>
                :
                null
            })
        );
    }

    handleChangeSeries = (event) => {
        this.setState({ series: event.target.name });
    }

    handleSubmit = (e) => {
        e.preventDefault();
        console.log(this.state);
        if (this.state.image === null) {
            this.setState({ showSubmitError: "Select an image file." });
        } else if (this.state.series === '') {
            this.setState({ showSubmitError: "Select a series." })
        } else {
            (async () => {
                const res = await fetch("http://localhost:8080/upload", {
                  method: "POST",
                  headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json; charset=utf-8"
                  },
                  body: JSON.stringify({
                    username: this.props.CurrUser.username,
                    token: this.props.CurrUser.token,
                    description: this.state.comicDescription,
                    name: this.state.comicName,
                    series: this.state.series,
                    privacy: this.state.privacy,
                    canvas: this.state.json ? JSON.stringify(this.state.json) : '',
                    image: this.state.image ? this.state.image : '',
                    sharedWith: this.state.sharedUsersList
                  })
                });
                let content = await res.json();
                console.log(content);
                if (content.result === 'success') {
                    console.log('DONE UPLOAD');
                    this.props.history.push('/view/comics');
                } else {
                    this.setState({ showSubmitError: content.result });
                }
            })();
        }
    }

    handleClearSubmitError = () => {
        this.setState({ showSubmitError: "" });
    }

    render() {
        const trs = this.state.sharedUsersList.map((username, i) => {
            return (
                <tr key={i}><td>{username}</td><td><button className="btn-danger" onClick={(e) => this.handleDeleteShare(i, e)}>Delete</button></td></tr>
            );
        });
        if (this.state.loading)
            return <LoadingScreen />
        return (
            <div className="upload-comic-container">
                <NavigationBar />
                <div className="upload-bottom-container">
                    <Form className="upload-form" onSubmit={this.handleSubmit}>
                        <div className="upload-container" id="upload-container">
                            <DropzoneArea
                                onChange={this.onFileUpload.bind(this)}
                                acceptedFiles={['image/*']}
                                maxFileSize={50000000}
                                filesLimit={1}
                            />
                        </div>
                        <div className="upload-info">
                            <Form.Control required className="upload-name-input" type="text" placeholder="Type Comic Name..." value={this.state.comicName} onChange={this.handleComicName} />
                            <div className="upload-comic-description">
                                <Form.Control required className="create-comic-description-input" as="textarea" rows="3"  placeholder="Write a description of the comic" value={this.state.comicDescription} onChange={this.handleComicDescription} />
                            </div>
                            <Dropdown className="upload-dropdown">
                                <Dropdown.Toggle variant="info" className="upload-dropdown-button">
                                    {this.state.series ? this.state.series : 'Select Series'}
                                </Dropdown.Toggle>
                                <Dropdown.Menu>
                                    {this.handleUserSeries()}
                                </Dropdown.Menu>
                            </Dropdown>
                        </div>
                        <div className="upload-sharing">
                            <div className="upload-sharing-inner">
                                <div className="upload-table-container">
                                <label>Add User: (Press 'Enter' to Add)</label>
                                <Form.Control type="text" placeholder="e.g. Sean Fang" value={this.state.userInput} onChange={this.handleAddUser} onKeyPress={this.handleAddUserEnter} />
                                    <Table bordered hover className="upload-sharing-table">
                                        <tbody>
                                            {trs}
                                        </tbody>
                                    </Table>
                                </div>
                                <div className="upload-sharing-right">
                                    <Form.Check type="radio" name="privacy" value="Public" label="Public" checked={this.state.privacy === 'Public'} onChange={this.handlePrivacy} />
                                    <Form.Check type="radio" name="privacy" value="Private" label="Private" checked={this.state.privacy === 'Private'} onChange={this.handlePrivacy} />
                                </div>
                            </div>
                        </div>
                        <div className="upload-submit">
                            <Button type="submit" variant="success" ref={this.selectFileRef}>Upload Comic</Button>
                            <Overlay target={this.selectFileRef.current} show={this.state.showSubmitError.length > 0} placement="right"><Tooltip onClick={this.handleClearSubmitError}>{this.state.showSubmitError}</Tooltip></Overlay>
                        </div>
                    </Form>
                </div>
                <Footer />
            </div>
        );
    }
}

UploadComic.propTypes = {
    CurrUser: PropTypes.object
}

export default connect(StateToProps, { })(withRouter(UploadComic));