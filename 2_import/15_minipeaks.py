#!/usr/bin/env python

from __future__ import print_function
import os, sys, json, argparse

from cassandra.cluster import Cluster
from cassandra.query import BatchStatement
from cassandra import ConsistencyLevel

sys.path.append(os.path.join(os.path.dirname(__file__), '../common/'))
from dbconnect import db_connect
from constants import paths

sys.path.append(os.path.join(os.path.dirname(__file__), '../../metadata/utils/'))
from utils import Utils
from db_utils import getcursor
from files_and_paths import Dirs
from paste import chunkedPaste

class ImportMinipeaks:
    def __init__(self, assembly, nbins, ver):
        self.assembly = assembly
        self.ver = ver

        self.cluster = Cluster()
        self.session = self.cluster.connect()
        self.keyspace = '_'.join([assembly, "minipeaks", str(ver), str(nbins)])
        self.session.execute("""
        CREATE KEYSPACE IF NOT EXISTS {ks} WITH replication
        = {'class':'SimpleStrategy', 'replication_factor':1};
        """.format(ks = self.keyspace))
        self.session.set_keyspace(self.keyspace)

    def importAll(self):
        fns = ["DNase-List.txt", "H3K27ac-List.txt", "H3K4me3-List.txt"]

        for fn in fns:
        assay = fn.split('-')[0]

        tableName = assay

        self.session.execute("""
DROP TABLE IF EXISTS """ + tableName)

        self.session.execute("""
CREATE TABLE IF NOT EXISTS {tn} (
accession text,
chrom text,
{fields},
PRIMARY KEY (accession, chrom) )
WITH compression = {{ 'sstable_compression' : 'LZ4Compressor' }};
""".format(tn = self.tableName,
           fields = ",".join([r + " text" for r in fileIDs])))

        mergedFnp = paths.path(self.assembly, "minipeaks", "merged.txt")
        printt("paste into", mergedFnp)

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--local', action="store_true", default=False)
    args = parser.parse_args()
    return args

def main():
    args = parse_args()

    DBCONN = db_connect(os.path.realpath(__file__), args.local)

    assemblies = ["hg19", "mm10"]
    if args.assembly:
        assemblies = [args.assembly]

    for assembly in assemblies:
        im = ImportMinipeaks(assembly, 20, 2)
        im.importAll()

if __name__ == '__main__':
    main()
