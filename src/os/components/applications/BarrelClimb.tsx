import React, { useState } from 'react';
import ClassicArcadeGame from '../arcade/ClassicArcadeGame';
import Window from '../os/Window';

export interface BarrelClimbAppProps extends WindowAppProps {}

const BarrelClimbApp: React.FC<BarrelClimbAppProps> = (props) => {
    const [width, setWidth] = useState(820);
    const [height, setHeight] = useState(610);

    return (
        <Window
            top={26}
            left={54}
            width={width}
            height={height}
            windowTitle="Barrel Climb"
            windowBarColor="#5d2711"
            windowBarIcon="windowGameIcon"
            bottomLeftText={'Original arcade mini-game'}
            closeWindow={props.onClose}
            onInteract={props.onInteract}
            minimizeWindow={props.onMinimize}
            onWidthChange={setWidth}
            onHeightChange={setHeight}
        >
            <ClassicArcadeGame
                kind="barrel"
                title="Barrel Climb"
                width={width}
                height={Math.max(420, height - 62)}
            />
        </Window>
    );
};

export default BarrelClimbApp;
