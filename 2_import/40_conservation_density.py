#!/usr/bin/env python2

from __future__ import print_function
import os
import sys
import psycopg2
import argparse

sys.path.append(os.path.join(os.path.dirname(__file__), '../common/'))
from constants import paths
from dbconnect import db_connect
from config import Config

sys.path.append(os.path.join(os.path.dirname(__file__), '../../metadata/utils/'))
from utils import printt
from db_utils import getcursor, makeIndex

class ImportConservation:
    def __init__(self, curs, assembly):
        self.curs = curs
        self.assembly = assembly
        self.tableName = assembly + "_conservation_bins"

    def run(self):
        printt("dropping and creating", self.tableName)
        self.curs.execute("""
DROP TABLE IF EXISTS {tableName};
CREATE TABLE {tableName}
(
    source character varying NOT NULL,
    density real NOT NULL,
    bin real NOT NULL,
    index real NOT NULL,
    min real NOT NULL,
    max real NOT NULL
);
""".format(tableName=self.tableName))

        #fnp = paths.path(self.assembly, "conservation_bins.tsv")
        fnp = "/mnt/z/home/hueyj/projects/ENCODE/SCREEN_conservation/%s/conservation_bins.tsv" % self.assembly
        printt("importing", fnp)
        with open(fnp) as f:
            cols = ["source", "density", "bin", "index", "min", "max"]
            self.curs.copy_from(f, self.tableName, '\t', columns=cols)
        printt("imported", self.curs.rowcount)


def run(args, DBCONN):
    assemblies = Config.assemblies
    if args.assembly:
        assemblies = [args.assembly]

    for assembly in assemblies:
        printt('***********', assembly)
        with getcursor(DBCONN, "40_conservation_density") as curs:
            g = ImportConservation(curs, assembly)
            g.run()


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--assembly", type=str, default="")
    args = parser.parse_args()
    return args


def main():
    args = parse_args()

    DBCONN = db_connect(os.path.realpath(__file__))
    run(args, DBCONN)

    return 0


if __name__ == '__main__':
    main()
