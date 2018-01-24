import { GraphQLFieldResolver } from 'graphql';
import * as DbGb from '../db/db_gb';
import { cache } from '../db/db_cache';
import { Version } from '../schema/schema';

export const resolve_gb_genetable: GraphQLFieldResolver<any, any> = (source, args, context, info) => {
    const version: Version = source.version;
    const range = args.range;
    return DbGb.genetable(version.assembly, range.chrom, range.start, range.end);
};

export const resolve_gb: GraphQLFieldResolver<any, any> = (source, args, context, info) => {
    const version: Version = args.version;
    return { version };
};
