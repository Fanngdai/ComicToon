import React, { Component } from 'react';

import NavigationBar from './NavigationBar';
import './styles/CreateComic.css';

class ViewSubs extends Component {
    render() {
        return (
            <div className="create-comic-container">
                <NavigationBar />
            </div>
        );
    }
}

export default ViewSubs;