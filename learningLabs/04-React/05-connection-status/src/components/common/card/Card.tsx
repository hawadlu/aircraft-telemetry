import {ScrollArea, Styles, Text} from '@mantine/core';
// @ts-ignore
import classes from './Card.module.css';
import * as React from "react";


type Card = {
    title?: string,
    content: string | React.JSX.Element,
    styleProps?: {
        title?: Styles<any>,
        content?: Styles<any>
    },
    cardData?: { title: string; content: string[] }
}

export default function Card({cardData, title, content}: Card) {
    if (typeof content === "string") {
        return (
            <div className={classes.card}>
                <Text className={classes.title}>{title}</Text>
                {
                    <Text className={classes.content}>
                        {content}
                    </Text>
                }
            </div>
        )
    } else {
        return (
            <div className={classes.card}>
                <Text className={classes.title}>{title}</Text>
                {content}
            </div>
        )
    }
}