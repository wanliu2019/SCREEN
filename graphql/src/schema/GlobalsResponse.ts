import { GraphQLString, GraphQLList, GraphQLObjectType, GraphQLNonNull, GraphQLInt, GraphQLFloat } from 'graphql';
import * as CommonTypes from './CommonSchema';
import {
    resolve_globals_assembly,
    resolve_help_key,
    resolve_ctinfo,
    resolve_globals_assembly_tfs,
    resolve_globals_assembly_cellCompartments,
    resolve_globals_assembly_cellTypeInfoArr,
    resolve_globals_assembly_chromCounts,
    resolve_globals_assembly_chromLens,
    resolve_globals_assembly_creHistBins,
    resolve_globals_assembly_geBiosampleTypes,
    resolve_globals_assembly_geBiosamples,
    resolve_globals_assembly_creBigBedsByCellType,
    resolve_globals_assembly_creFiles,
    resolve_globals_assembly_inputData,
    resolve_globals_helpKeys,
    resolve_globals_colors,
    resolve_globals_files,
    resolve_globals_inputData,
    resolve_globals_assembly_geExperiments,
    resolve_globals_assembly_gene,
    resolve_globals_assembly_conservation_bins,
} from '../resolvers/globals';
import { GeneExpBiosample } from './GeneExpResponse';
const GraphQLJSON = require('graphql-type-json');

export const ConservationBinData = new GraphQLObjectType({
    name: 'ConservationBinData',
    fields: () => ({
        binstart: {
            type: new GraphQLNonNull(GraphQLFloat),
        },
        density: {
            type: new GraphQLNonNull(GraphQLFloat),
        },
    }),
});

export const ConservationBins = new GraphQLObjectType({
    name: 'ConservationBins',
    description: 'Density values for each bin of conservation values, for each source',
    fields: () => ({
        source: {
            type: new GraphQLNonNull(GraphQLString),
        },
        min: {
            type: new GraphQLNonNull(GraphQLFloat),
        },
        max: {
            type: new GraphQLNonNull(GraphQLFloat),
        },
        data: {
            type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(ConservationBinData))),
        },
    }),
});

export const AssemblySpecificGlobalsResponse = new GraphQLObjectType({
    name: 'AssemblySpecificGlobals',
    description: 'Assembly-specific global data',
    fields: () => ({
        tfs: {
            description: 'A list of all transcription factors used',
            type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLString))),
            resolve: resolve_globals_assembly_tfs,
        },
        cellCompartments: {
            description: 'A list of cell compartments',
            type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLString))),
            resolve: resolve_globals_assembly_cellCompartments,
        },
        cellTypeInfoArr: {
            description: 'Get info on all cell types used and assays used for ccRE data',
            type: new GraphQLList(new GraphQLNonNull(CommonTypes.CellTypeInfo)),
            resolve: resolve_globals_assembly_cellTypeInfoArr,
        },
        ctinfo: {
            description: 'Gets the info for a specific cell type. Can use "none" to return nothing.',
            type: CommonTypes.CellTypeInfo,
            args: {
                cellType: {
                    description: 'The cellType to get info for',
                    type: new GraphQLNonNull(GraphQLString),
                },
            },
            resolve: resolve_ctinfo,
        },
        chromCounts: {
            description: 'Returns the numbers of ccREs keyed by chromosome',
            type: GraphQLJSON,
            resolve: resolve_globals_assembly_chromCounts,
        },
        chromLens: {
            description: 'Returns the length of each chromosome',
            type: GraphQLJSON,
            resolve: resolve_globals_assembly_chromLens,
        },
        creHistBins: {
            description: 'Returns the numbers of ccREs in each bin of a chromosome',
            type: GraphQLJSON,
            resolve: resolve_globals_assembly_creHistBins,
        },
        geBiosampleTypes: {
            description: 'Returns biosample types available in gene expression',
            type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLString))),
            resolve: resolve_globals_assembly_geBiosampleTypes,
        },
        geBiosamples: {
            description: 'Returns biosamples available in gene expression',
            type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GeneExpBiosample))),
            resolve: resolve_globals_assembly_geBiosamples,
        },
        geExperiments: {
            description: 'Returns experiments available in gene expression. Can be filtered for a specific biosample.',
            type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLString))),
            args: {
                biosample: {
                    type: GraphQLString,
                },
            },
            resolve: resolve_globals_assembly_geExperiments,
        },
        creBigBedsByCellType: {
            description: 'Returns the accessions of the celltype-specific bigBed files for ccREs on ENCODE',
            type: GraphQLJSON,
            resolve: resolve_globals_assembly_creBigBedsByCellType,
        },
        creFiles: {
            description: 'Returns info on the data used to create ccREs',
            type: GraphQLJSON,
            resolve: resolve_globals_assembly_creFiles,
        },
        inputData: {
            description: 'Returns info on the data used for SCREEN',
            type: GraphQLJSON,
            resolve: resolve_globals_assembly_inputData,
        },
        gene: {
            description: 'Returns info related to a specific gene',
            type: CommonTypes.Gene,
            args: {
                gene: {
                    type: GraphQLString,
                },
            },
            resolve: resolve_globals_assembly_gene,
        },
        conservation_bins: {
            description: 'Returns the density values for conservation scores of all ccREs',
            type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(ConservationBins))),
            resolve: resolve_globals_assembly_conservation_bins,
        },
    }),
});

export const HelpKeys = new GraphQLObjectType({
    name: 'HelpKeys',
    fields: () => ({
        all: { type: GraphQLJSON },
        helpKey: {
            description: 'Provides the help text for a single helpKey',
            args: {
                key: { type: new GraphQLNonNull(GraphQLString) },
            },
            type: HelpKey,
            resolve: resolve_help_key,
        },
    }),
});

export const HelpKey = new GraphQLObjectType({
    name: 'HelpKey',
    description: 'Describes a response to a single helpkey',
    fields: () => ({
        title: { type: new GraphQLNonNull(GraphQLString) },
        summary: { type: new GraphQLNonNull(GraphQLString) },
    }),
});

export const GlobalsResponse = new GraphQLObjectType({
    name: 'Globals',
    description: 'Global data',
    fields: () => ({
        helpKeys: {
            type: new GraphQLNonNull(HelpKeys),
            resolve: resolve_globals_helpKeys,
        },
        colors: {
            type: new GraphQLNonNull(GraphQLJSON),
            resolve: resolve_globals_colors,
        },
        files: {
            type: GraphQLJSON,
            resolve: resolve_globals_files,
        },
        inputData: {
            type: GraphQLJSON,
            resolve: resolve_globals_inputData,
        },
        byAssembly: {
            args: {
                assembly: { type: new GraphQLNonNull(CommonTypes.Assembly) },
            },
            type: new GraphQLNonNull(AssemblySpecificGlobalsResponse),
            resolve: resolve_globals_assembly,
        },
    }),
});

export default GlobalsResponse;
