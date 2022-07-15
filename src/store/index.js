import GraphStore from "./graph.store";
import React from "react";

class RootStore {
    constructor() {
        this.graphStore = new GraphStore()
    }
}

const rootStore = new RootStore()
const context = React.createContext(rootStore)
const useStore = () => React.useContext(context)

export {useStore}