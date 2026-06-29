import React, { useState } from 'react';
import ClassicArcadeGame from '../arcade/ClassicArcadeGame';
import Window from '../os/Window';

export interface PixelPlumberAppProps extends WindowAppProps {}

const PixelPlumberApp: React.FC<PixelPlumberAppProps> = (props) => {
    const [width, setWidth] = useState(820);
    const [height, setHeight] = useState(610);

    return (
        <Window
            top={10}
            left={10}
            width={width}
            height={height}
            windowTitle="Pixel Plumber"
            windowBarColor="#b51f1f"
            windowBarIcon="windowGameIcon"
            bottomLeftText={'Original arcade mini-game'}
            closeWindow={props.onClose}
            onInteract={props.onInteract}
            minimizeWindow={props.onMinimize}
            onWidthChange={setWidth}
            onHeightChange={setHeight}
        >
            <ClassicArcadeGame
                kind="platform"
                title="Pixel Plumber"
                width={width}
                height={Math.max(420, height - 62)}
            />
        </Window>
    );
};

export default PixelPlumberApp;
