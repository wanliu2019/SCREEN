import MainTabInfo from './maintabs.js'

const initialState = {
        ...GlobalParsedQuery,
    compartments: GlobalCellCompartments,
    compartments_selected: new Set(GlobalCellCompartments),
    maintabs: MainTabInfo,
    maintabs_active: "gene_expression",
    maintabs_visible: true
};

export default initialState;