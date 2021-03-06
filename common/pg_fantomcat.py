
# SPDX-License-Identifier: MIT
# Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng

import sys
import os
import math

sys.path.append(os.path.join(os.path.dirname(__file__), '../utils'))
from utils import Utils, printt, importedNumRows

class PGFantomCat:

    GENECOLUMNS = [
        ("id", "serial PRIMARY KEY"),
        ("chrom", "TEXT"), ("start", "INT"), ("stop", "INT"), ("strand", "TEXT"),
        ("geneid", "TEXT"), ("genename", "TEXT"), ("aliases", "TEXT"),
        ("geneclass", "TEXT"),
        ("dhssupport", "TEXT"), ("genecategory", "TEXT"),
        ("TIRconservation", "FLOAT"),
        ("exonconservation", "FLOAT"), ("traitdfr", "FLOAT"),
        ("eqtlcoexpr", "FLOAT"), ("dynamicexpr", "FLOAT")
    ]
    GENEFIELDS = [x for x, _ in GENECOLUMNS]

    ENHANCERCOLUMNS = [
        ("id", "serial PRIMARY KEY"),
        ("chrom", "TEXT"), ("start", "INT"), ("stop", "INT"), ("score", "FLOAT"),
        ("ccRE_acc", "TEXT")
    ]
    ENHANCERFIELDS = [x for x, _ in ENHANCERCOLUMNS]

    CAGECOLUMNS = [
        ("id", "serial PRIMARY KEY"),
        ("chrom", "TEXT"), ("start", "INT"), ("stop", "INT"), ("score", "FLOAT"), ("strand", "TEXT"),
        ("tssstart", "INT"), ("tssstop", "INT"), ("ccRE_acc", "TEXT")
    ]
    CAGEFIELDS = [x for x, _ in CAGECOLUMNS]

    def __init__(self, pw, assembly, tableprefix="fantomcat"):
        self.pw = pw
        self._tables = {
            "genes": "_".join((assembly, tableprefix, "genes")),
            "intersections": "_".join((assembly, tableprefix, "intersection")),
            "twokb_intersections": "_".join((assembly, tableprefix, "twokbintersection")),
            "enhancers": "_".join((assembly, tableprefix, "enhancers")),
            "cage": "_".join((assembly, tableprefix, "cage"))
        }

    def drop_and_recreate(self, curs):
        self.pw.execute("drop_and_recreate", """
        DROP TABLE IF EXISTS {genes};
        CREATE TABLE {genes} ({fields})
        """.format(genes=self._tables["genes"],
                   fields=",".join(" ".join(x) for x in PGFantomCat.GENECOLUMNS)))

        self.pw.execute("drop_and_recreate", """
        DROP TABLE IF EXISTS {intersections};
        CREATE TABLE {intersections} 
        (id serial PRIMARY KEY, geneid TEXT, cre TEXT)
        """.format(intersections=self._tables["intersections"]))

        self.pw.execute("drop_and_recreate", """
        DROP TABLE IF EXISTS {intersections};
        CREATE TABLE {intersections} 
        (id serial PRIMARY KEY, geneid TEXT, cre TEXT)
        """.format(intersections=self._tables["twokb_intersections"]))

        self.pw.execute("drop_and_recreate", """
        DROP TABLE IF EXISTS {enhancers};
        CREATE TABLE {enhancers} ({fields})
        """.format(enhancers = self._tables["enhancers"],
                   fields = ",".join(" ".join(x) for x in PGFantomCat.ENHANCERCOLUMNS)))
        self.pw.execute("drop_and_recreate", """
        DROP TABLE IF EXISTS {cage};
        CREATE TABLE {cage} ({fields})
        """.format(cage = self._tables["cage"],
                   fields = ",".join(" ".join(x) for x in PGFantomCat.CAGECOLUMNS)))

    def import_enhancers_fromfile(self, fnp):
        numRows = self.pw.copy_from("import_enhancers_fromfile",
                                    fnp,
                                    self._tables["enhancers"],
                                    columns = [x for x in PGFantomCat.ENHANCERFIELDS[1:]])
        importedNumRows(numRows)

    def import_cage_fromfile(self, fnp):
        numRows = self.pw.copy_from("import_cage_fromfile",
                                    fnp,
                                    self._tables["cage"],
                                    columns = [x for x in PGFantomCat.CAGEFIELDS[1:]])
        importedNumRows(numRows)

    def import_genes_fromfile(self, fnp):
        numRows = self.pw.copy_from("import_genes_fromfile",
                                    fnp,
                                    self._tables["genes"],
                                    columns=[x for x in PGFantomCat.GENEFIELDS[1:]])
        importedNumRows(numRows)

    def import_intersections_fromfile(self, fnp, key="intersections"):
        numRows = self.pw.copy_from("import_intersections_fromfile",
                                    fnp,
                                    self._tables[key],
                                    columns=["geneid", "cre"])
        importedNumRows(numRows)

    def select_enhancers(self, ccREacc):
        rows = self.pw.fetchall("select_enhancers", """
        SELECT chrom, start, stop, score 
        FROM {enhancers} 
        WHERE ccRE_acc = %(acc)s
        """.format(enhancers = self._tables["enhancers"]),
                                {"acc": ccREacc})
        return rows

    def select_cage(self, ccREacc):
        rows = self.pw.fetchall("select_cage", """
        SELECT chrom, start, stop, strand, score, tssstart, tssstop
        FROM {cage} 
        WHERE ccRE_acc = %(acc)s
        """.format(cage = self._tables["cage"]),
                                {"acc": ccREacc})
        return rows

    def select_gene(self, field, value):
        if field not in [x for x in PGFantomCat.GENEFIELDS]:
            print("WARNING: attempted to select '%s' from nonexistent column '%s' in FantomCat table"
                  % (value, field))
            return None
        
        rows = self.pw.fetchall("select_gene", """
        SELECT *
        FROM {genes} 
        WHERE {field} = %s
        """.format(genes=self._tables["genes"], field=field),
                                value)
        return rows

    def select_cre_intersections(self, acc, key="intersections"):
        if key not in self._tables:
            raise Exception("pgfantomcat$PGFantomCat::select_cre_intersections: invalid tablename '%s'" % key)
        
        rows = self.pw.fetchall("select_cre_intersections", """
        SELECT {fields}
        FROM {genes} AS g, 
        {intersections} as i
        WHERE i.geneid = g.geneid AND i.cre = %(acc)s
        """.format(intersections=self._tables[key],
                   genes=self._tables["genes"],
                   fields=",".join([("g." + x) for x in PGFantomCat.GENEFIELDS[1:]])),
                                {"acc": acc})
        # FIXME: WTF Henry?
        return [{PGFantomCat.GENEFIELDS[i + 1]: v[i] if i < 10 or not math.isnan(v[i]) else "--"
                 for i in range(len(v))} for v in rows]

    def select_rna_intersections(self, gid, key="intersections"):
        if key not in self._tables:
            raise Exception("pgfantomcat$PGFantomCat::select_rna_intersections: invalid tablename '%s'" % key)

        rows = self.pw.fetchall("select_rna_intersections", """
        SELECT cre 
        FROM {intersections} 
        WHERE geneid = %s
        """.format(intersections=self._tables[key]),
                                gid)
        return [x[0] for x in rows]
