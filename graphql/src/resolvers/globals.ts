import { GraphQLFieldResolver } from 'graphql';
import { global_data_global, global_data } from '../db/db_cache';

export const resolve_globals: GraphQLFieldResolver<any, any> = (source, args, context) => {
    const versiontag: string = args.versiontag;
    return global_data_global(versiontag);
};

export const resolve_globals_assembly: GraphQLFieldResolver<any, any> = (source, args, context) => {
    const versiontag: string = source.versiontag;
    const assembly: string = args.assembly;
    return global_data({versiontag, assembly});
};
