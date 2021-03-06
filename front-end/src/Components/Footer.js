import React, { Component } from 'react';
import {withRouter} from 'react-router-dom';
import './styles/Footer.css';

class Footer extends Component {
    handleGoToAbout = (e) =>{
        this.props.history.push('/about')
    }
    render() {
        return (
            <footer className="footer-container">
                <p className="footer-paragraph" onClick={this.handleGoToAbout}>All content&nbsp;&#169;&nbsp;Hot Pink Enterprise</p>
            </footer>
        );
    }
}

export default withRouter(Footer);