/**
 * @fileoverview Tests for FileFinder class.
 * @author Michael Mclaughlin
 */

"use strict";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

var assert = require("chai").assert,
    path = require("path"),
    FileFinder = require("../../lib/file-finder.js");

//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

describe("FileFinder", function() {
    var fixtureDir = path.resolve(__dirname, "..", "fixtures"),
        fileFinderDir = path.join(fixtureDir, "file-finder"),
        subdir = path.join(fileFinderDir, "subdir"),
        subsubdir = path.join(subdir, "subsubdir"),
        subsubsubdir = path.join(subsubdir, "subsubsubdir"),
        absentFileName = "4ktrgrtUTYjkopoohFe54676hnjyumlimn6r787",
        uniqueFileName = "xvgRHtyH56756764535jkJ6jthty65tyhteHTEY";

    describe("findAllInDirectoryAndParents()", function() {
        var actual,
            expected,
            finder;

        describe("a file present in the cwd", function() {

            it("should be found, and returned as the first element of an array", function() {
                finder = new FileFinder(uniqueFileName, process.cwd());
                actual = finder.findAllInDirectoryAndParents(fileFinderDir);
                expected = path.join(fileFinderDir, uniqueFileName);

                assert.isArray(actual);
                assert.equal(actual[0], expected);
            });
        });

        describe("a file present in a parent directory", function() {

            it("should be found, and returned as the first element of an array", function() {
                finder = new FileFinder(uniqueFileName, process.cwd());
                actual = finder.findAllInDirectoryAndParents(subsubsubdir);
                expected = path.join(fileFinderDir, "subdir", uniqueFileName);

                assert.isArray(actual);
                assert.equal(actual[0], expected);
            });
        });

        describe("searching for multiple files", function() {

            it("should return only the first specified file", function() {
                var firstExpected = path.join(fileFinderDir, "subdir", "empty"),
                    secondExpected = path.join(fileFinderDir, "empty");

                finder = new FileFinder(["empty", uniqueFileName], process.cwd());
                actual = finder.findAllInDirectoryAndParents(subdir);

                assert.equal(actual.length, 2);
                assert.equal(actual[0], firstExpected);
                assert.equal(actual[1], secondExpected);
            });

            it("should return the second file when the first is missing", function() {
                var firstExpected = path.join(fileFinderDir, "subdir", uniqueFileName),
                    secondExpected = path.join(fileFinderDir, uniqueFileName);

                finder = new FileFinder(["notreal", uniqueFileName], process.cwd());
                actual = finder.findAllInDirectoryAndParents(subdir);

                assert.equal(actual.length, 2);
                assert.equal(actual[0], firstExpected);
                assert.equal(actual[1], secondExpected);
            });

            it("should return multiple files when the first is missing and more than one filename is requested", function() {
                var firstExpected = path.join(fileFinderDir, "subdir", uniqueFileName),
                    secondExpected = path.join(fileFinderDir, uniqueFileName);

                finder = new FileFinder(["notreal", uniqueFileName, "empty2"], process.cwd());
                actual = finder.findAllInDirectoryAndParents(subdir);

                assert.equal(actual.length, 2);
                assert.equal(actual[0], firstExpected);
                assert.equal(actual[1], secondExpected);
            });

        });

        describe("two files present with the same name in parent directories", function() {
            var firstExpected = path.join(fileFinderDir, "subdir", uniqueFileName),
                secondExpected = path.join(fileFinderDir, uniqueFileName);

            before(function() {
                finder = new FileFinder(uniqueFileName, process.cwd());
            });

            it("should both be found, and returned in an array", function() {
                actual = finder.findAllInDirectoryAndParents(subsubsubdir);

                assert.isArray(actual);
                assert.equal(actual[0], firstExpected);
                assert.equal(actual[1], secondExpected);
            });

            it("should be in the cache after they have been found", function() {

                assert.equal(finder.cache[subsubsubdir][0], firstExpected);
                assert.equal(finder.cache[subsubsubdir][1], secondExpected);
                assert.equal(finder.cache[subsubdir][0], firstExpected);
                assert.equal(finder.cache[subsubdir][1], secondExpected);
                assert.equal(finder.cache[subdir][0], firstExpected);
                assert.equal(finder.cache[subdir][1], secondExpected);
                assert.equal(finder.cache[fileFinderDir][0], secondExpected);
                assert.equal(finder.cache[fileFinderDir][1], void 0);
            });
        });

        describe("an absent file", function() {

            it("should not be found, and an empty array returned", function() {
                finder = new FileFinder(absentFileName, process.cwd());
                actual = finder.findAllInDirectoryAndParents();

                assert.isArray(actual);
                assert.lengthOf(actual, 0);
            });
        });

        /**
         * The intention of this test case is not clear to me. It seems
         * to be a special case of "a file present in a parent directory" above.
         * Apart from that: Searching for package.json up to the root
         * is kind of non-deterministic for testing purposes. A unique file name
         * and/or restricting the search up to the workspace root (not /) would
         * be better. The original code assumed there will never be a package.json
         * outside of the eslint workspace, but that cannot be guaranteed.
         */
        describe("Not consider directory with expected file names", function() {
            it("should only find one package.json from the root", function() {
                expected = path.join(process.cwd(), "package.json");
                finder = new FileFinder("package.json", process.cwd());
                actual = finder.findAllInDirectoryAndParents(fileFinderDir);

                /**
                 * Filter files outside of current workspace, otherwise test fails,
                 * if there is for example a ~/package.json file.
                 * In order to eliminate side effects of files located outside of
                 * workspace this should be done for all test cases here.
                 */
                actual = actual.filter(function(file) {
                    return (file || "").indexOf(process.cwd()) === 0;
                });

                assert.equal(actual, expected);
            });
        });
    });
});
