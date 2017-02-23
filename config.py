#!/usr/bin/env python

from __future__ import print_function
import sys, os
import ConfigParser

class Config:
    fnp = os.path.join(os.path.dirname(os.path.realpath(__file__)), "config.ini")
    if not os.path.exists(fnp):
        print("ERROR: file not found:", fnp)
        print("\tfile should be symlink'd to a desired config.<blah>.ini file")
        sys.exit(1)

    c = ConfigParser.ConfigParser()
    c.read(fnp)

    version = c.get("RE", "version")
    database = c.get("RE", "database")