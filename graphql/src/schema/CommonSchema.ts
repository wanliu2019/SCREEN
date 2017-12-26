import {
    GraphQLBoolean,
    GraphQLList,
    GraphQLString,
    GraphQLInt,
    GraphQLFloat,
    GraphQLObjectType,
    GraphQLSchema,
    GraphQLID,
    GraphQLNonNull,
    GraphQLInputObjectType,
    GraphQLEnumType
} from 'graphql';


export const Assembly = new GraphQLEnumType({
    name: 'Assembly',
    values: {
        mm10: {
            value: 'mm10'
        },
        hg19: {
            value: 'hg19'
        }
    }
});

export const ElementType = new GraphQLEnumType({
    name: 'ElementType',
    values: {
        promoterLike: {
            value: 'promoter-like'
        },
        enhancerLike: {
            value: 'enhancer-like'
        },
        insulatorLike: {
            value: 'insulator-like'
        }
    }
});

export const ChromRange = new GraphQLObjectType({
    name: 'ChromRange',
    fields: () => ({
        chrom: { type: new GraphQLNonNull(GraphQLString) },
        start: { type: GraphQLInt },
        end: { type: GraphQLInt },
        strand: { type: GraphQLString } // TODO: enum
    })
});

export const InputChromRange = new GraphQLInputObjectType({
    name: 'InputChromRange',
    fields: () => ({
        chrom: { type: new GraphQLNonNull(GraphQLString) },
        start: { type: GraphQLInt },
        end: { type: GraphQLInt },
    })
});

export const InputExpMax = new GraphQLInputObjectType({
    name: 'InputExpMax',
    fields: () => ({
        rank_ctcf_end: { type: GraphQLFloat },
        rank_ctcf_start: { type: GraphQLFloat },
        rank_dnase_end: { type: GraphQLFloat },
        rank_dnase_start: { type: GraphQLFloat },
        rank_enhancer_end: { type: GraphQLFloat },
        rank_enhancer_start: { type: GraphQLFloat },
        rank_promoter_end: { type: GraphQLFloat },
        rank_promoter_start: { type: GraphQLFloat },
    })
});

export const DataParameters = new GraphQLInputObjectType({
    name: 'DataParameters',
    fields: () => ({
        accessions: { type: new GraphQLList(GraphQLString) }, // TODO: special type
        cellType: { type: GraphQLString },
        range: { type: InputChromRange },
        expmaxs: { type: InputExpMax },
        element_type: { type: ElementType },
    })
});

export const SearchParameters = new GraphQLInputObjectType({
    name: 'SearchParameters',
    fields: () => ({
        q: {
            type: GraphQLString
        },
        assembly: {
            type: new GraphQLNonNull(Assembly)
        },
        uuid: {
            type: new GraphQLNonNull(GraphQLString)
        }
    })
});
