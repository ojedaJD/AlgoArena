import type { LanguageConfig } from './index.js';

export const java: LanguageConfig = {
  name: 'java',
  image: 'dsa-judge-java:latest',
  extension: '.java',
  compileCmd: 'javac /sandbox/Solution.java',
  runCmd: 'java -cp /sandbox Solution',
  boilerplate: `import java.util.*;
import java.io.*;

public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[] nums = new int[n];
        for (int i = 0; i < n; i++) {
            nums[i] = sc.nextInt();
        }

        // TODO: implement your solution
        int result = 0;

        System.out.println(result);
    }
}
`,
};
