import MainTabInfo from './maintabs.js'

const initialState = {
        ...GlobalParsedQuery,
    maintabs: MainTabInfo,
    maintabs_active: "de_expression",
    maintabs_visible: true
};

export default initialState;
