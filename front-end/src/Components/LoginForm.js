import React, { Component } from 'react';
import { Alert, Form } from 'react-bootstrap';
import './styles/Welcome.css';
import {withRouter} from 'react-router-dom'
import PropTypes from 'prop-types';
import {connect} from 'react-redux'
import {LoginUser} from '../Actions/UserActions'

const StateToProps = (state) => ({ //application level state via redux
    user: state.user
});

class LoginForm extends Component {
    constructor() {
        super();
        this.state = {
          pwd: "",
          email: "",
          error: "",
        };
    }

    componentWillReceiveProps(nextProps){
        if(nextProps.user.username !== "") {
            this.props.history.push('/home');
            // localStorage.setItem('user', nextProps.user.username);
        }
        else if (nextProps.user.loginError) {
            this.setState({ error: nextProps.user.loginError });
        }
        else if(!nextProps.user.verified && !nextProps.user.registerError){
            this.props.history.push('/verify');
        }
    }

    handleLogin = (e) => {
        e.preventDefault();
        this.props.LoginUser(this.state.email, this.state.pwd);
    }

    handleChange = e => {
        const { name, value } = e.target;
        this.setState({ [name]: value });
    }

    render() {
        return (
            <Form className="welcome" onSubmit={this.handleLogin}>
                {this.state.error ? <Alert variant="danger" >{this.state.error}</Alert> : <Alert variant="danger" style={{ visibility: "hidden" }}>Hi</Alert>}
                <div className="bubbletext">
                    <Form.Control required id="email" type="email" name="email" className ="paddedFormControl textbox" placeholder="Enter your email..." onChange={this.handleChange}/>
                </div>
                <br />
                <div className="bubbletext">
                    <Form.Control required id="pwd" type="password" name="pwd" className ="paddedFormControl textbox" placeholder="Enter your password..." onChange={this.handleChange}/>
                </div>
                <br />
                <button type="submit" className = "paddedFormControl">Login</button>
            </Form>
        );
    } 
}

LoginForm.propTypes = {
    LoginUser: PropTypes.func.isRequired,
    user: PropTypes.object,
};

export default connect(StateToProps, {LoginUser})(withRouter(LoginForm));