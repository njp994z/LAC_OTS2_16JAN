import { storage } from "../../storage";
import { layoutOptions } from "./constants";

function getLayouts() {
    return layoutOptions
}

async function getLayout(id: string) {
    // connect to db 
    // find layoutdetails from db of this id and share 
    const layout = await storage.getScreenLayout(id);
    if (layout) {
        return {
            id: layout.id,
            ...layout.data as object
        }
    }
    
    // Fallback to static options if not found, but return in correct format?
    // The static options only have id and label, no data.
    // If no data in DB, return empty structure or null
    const staticOption = layoutOptions.find((l) => l.id === id);
    if (staticOption) {
        return {
            id: staticOption.id,
            nodes: [],
            edges: [],
            nodeMap: {}
        }
    }
    return null;
}

async function setLayout (body: any, id: string) {
    // connect to db 
    // save layoutdetails to db 
    const saved = await storage.saveScreenLayout(id, body);
    return {
        id: saved.id,
        ...saved.data as object
    };
}


export {
    getLayouts,
    getLayout,
    setLayout
}
