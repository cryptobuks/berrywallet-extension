import React from 'react';

export interface ILogoProps {
    className?: string;
}

export class BerrywalletLogo extends React.Component<ILogoProps, any> {
    render() {

        const {className} = this.props;

        return (<svg viewBox="0 0 512 512"
                     version="1.1" xmlns="http://www.w3.org/2000/svg"
                     xlinkHref="http://www.w3.org/1999/xlink"
                     className={className}
        >
            <g transform="translate(27.000000, 23.000000)">
                <path fill="#FF3974"
                      d="M205.5,405.35 C284.946161,405.35 349.35,340.946161 349.35,261.5 C349.35,182.053839 284.946161,117.65 205.5,117.65 C126.053839,117.65 61.65,182.053839 61.65,261.5 C61.65,340.946161 126.053839,405.35 205.5,405.35 Z M205.5,467 C92.0054839,467 0,374.994516 0,261.5 C0,148.005484 92.0054839,56 205.5,56 C318.994516,56 411,148.005484 411,261.5 C411,374.994516 318.994516,467 205.5,467 Z"/>
                <circle fill="#2AC062" cx="415" cy="44" r="44"/>
            </g>
        </svg>)
    }
}