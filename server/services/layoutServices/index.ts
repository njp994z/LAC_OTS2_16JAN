import { layoutOptions } from "./constants";

function getLayouts() {
    return layoutOptions
}

function getLayout(id: string) {
    // connect to db 
    // find layoutdetails from db of this id and share 
    return layoutOptions.find((layout) => layout.id === id)
}

function setLayout (body: any, id?: string) {
    // connect to db 
    // save layoutdetails to db 
    return layoutOptions.find((layout) => layout.id === id)
}


export {
    getLayouts,
    getLayout,
    setLayout
}
