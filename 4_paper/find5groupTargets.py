#!/usr/bin/env python

from __future__ import print_function

import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), '../../metadata/utils'))
from utils import Utils, AddPath
from exp import Exp
from querydcc import QueryDCC
from cache_memcache import MemCacheWrapper

AddPath(__file__, '../common/')
from dbconnect import db_connect
from postgres_wrapper import PostgresWrapper

AddPath(__file__, '../website/common/')
from pg import PGsearch
from cached_objects import CachedObjects
from pg_common import PGcommon
from cached_objects import CachedObjectsWrapper

def main():
    DBCONN = db_connect(os.path.realpath(__file__))

    ps = PostgresWrapper(DBCONN)
    cacheW = CachedObjectsWrapper(ps)

    ctsHg19 = cacheW["hg19"].datasets.byCellType.keys()
    ctsMm10 = cacheW["mm10"].datasets.byCellType.keys()
    print('\n'.join(sorted(ctsHg19 + ctsMm10)))
    sys.exit(1)
    
    url = "https://www.encodeproject.org/search/?searchTerm=Candidate+Regulatory+Elements+%28cREs%29&type=Annotation"
    url += "&format=json"
    url += "&limit=all"

    mc = MemCacheWrapper("localhost")
    qd = QueryDCC(cache=mc)
    #qd = QueryDCC()

    for exp in qd.getExps(url):
        if not "5-group" in exp.description:
            continue
        alias = exp.jsondata["aliases"][0]
        toks = alias.split('-')
        assembly = toks[2]
        cache = cacheW[assembly]
        if "zhiping-weng:cREs-mm10-v10-5group" == alias:
            continue
        cts = cache.datasets.byCellType.keys()


        print(exp.encodeID, alias)
        


if __name__ == "__main__":
    sys.exit(main())
