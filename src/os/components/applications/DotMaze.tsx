import React, { useState } from 'react';
import ClassicArcadeGame from '../arcade/ClassicArcadeGame';
import Window from '../os/Window';

export interface DotMazeAppProps extends WindowAppProps {}

const DotMazeApp: React.FC<DotMazeAppProps> = (props) => {
    const [width, setWidth] = useState(820);
    const [height, setHeight] = useState(610);

    return (
        <Window
            top={18}
            left={32}
            width={width}
            height={height}
            windowTitle="Dot Maze"
            windowBarColor="#101a73"
            windowBarIcon="windowGameIcon"
            bottomLeftText={'Original arcade mini-game'}
            closeWindow={props.onClose}
            onInteract={props.onInteract}
            minimizeWindow={props.onMinimize}
            onWidthChange={setWidth}
            onHeightChange={setHeight}
        >
            <ClassicArcadeGame
                kind="maze"
                title="Dot Maze"
                width={width}
                height={Math.max(420, height - 62)}
            />
        </Window>
    );
};

export default DotMazeApp;
