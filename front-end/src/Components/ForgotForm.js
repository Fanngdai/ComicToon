import React, { Component } from 'react';
import { Alert, Button, Form } from 'react-bootstrap';
import './styles/ForgotForm.css';

class ForgotForm extends Component {
    render() {
        return (
            <div className="Forgot-container">
                <Alert>
                    <p>Please enter your email associated with your account. We will email you your password reset link.</p>
                </Alert>
                <Form className="forgot-form">
                    <Form.Control type="email" placeholder="Enter your email..." />
                    <Button type="submit" variant="primary" >Submit</Button>
                </Form>
            </div>
        );
    }
}

export default ForgotForm;