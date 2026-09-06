import {Styles, Text} from '@mantine/core';
// @ts-ignore
import classes from './Card.module.css';


type Card = {
    title?: string,
    content: string,
    styleProps?: {
        title?: Styles<any>,
        content?: Styles<any>
    },
    cardData?: { title: string; content: string[] }
}

export default function Card({cardData, title, content}: Card) {
    return (
        <div className={classes.card}>
            <Text className={classes.title}>{title}</Text>
            <Text className={classes.content}>
                 {content}
             </Text>
        </div>
    )
}