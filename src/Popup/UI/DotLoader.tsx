import React from 'react';

export class DotLoader extends React.PureComponent<any, any> {
    render() {
        return (
            <span className="dot-loader">
                <span className="dot-loader__dot"/>
                <span className="dot-loader__dot"/>
                <span className="dot-loader__dot"/>
            </span>
        )
    }
}